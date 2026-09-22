import { Player, Formation, FormationSlot, PlayerMatchState, PositionCategory } from '../types/soccer';
import { getEffectiveSlotCategory, isWingPosition, isCenterPosition } from '../data/formations';

interface AssignmentCandidate {
  player: Player;
  slot: FormationSlot;
  score: number;
}

export function autoFillLineup(
  players: Player[],
  formation: Formation,
  existingStates?: Record<string, PlayerMatchState>,
  useStarters = false
): Record<string, PlayerMatchState> {
  const resultStates: Record<string, PlayerMatchState> = {};

  // Initialize base state for every player
  players.forEach(p => {
    const existing = existingStates?.[p.id];
    resultStates[p.id] = {
      playerId: p.id,
      status: existing?.status === 'absent' ? 'absent' : 'on_bench',
      assignedSlotId: undefined,
      assignedRole: undefined,
      totalFieldSeconds: existing?.totalFieldSeconds || 0,
      totalBenchSeconds: existing?.totalBenchSeconds || 0,
      currentStintSeconds: existing?.currentStintSeconds || 0,
      periodsPlayedCount: existing?.periodsPlayedCount || 0,
      periodsPlayed: existing?.periodsPlayed || [],
      isTired: existing?.isTired || false,
      goals: existing?.goals || 0,
      tacticalOverride: existing?.tacticalOverride,
    };
  });

  // Only non-absent players are available to start on field
  const availablePlayers = players.filter(p => resultStates[p.id]?.status !== 'absent');
  const unassignedSlots = [...formation.slots];

  // Helper function to check position compatibility across Soccer and Basketball
  function isPositionCompatible(preferredPositions: PositionCategory[], slotCategory: PositionCategory, slotRole: string): boolean {
    if (preferredPositions.includes(slotCategory)) return true;

    // Basketball mappings
    if (preferredPositions.includes('GUARD') && (slotRole === 'PG' || slotRole === 'SG')) return true;
    if (preferredPositions.includes('WING') && (slotRole === 'SG' || slotRole === 'SF' || slotRole === 'PF')) return true;
    if (preferredPositions.includes('POST') && (slotRole === 'PF' || slotRole === 'C')) return true;
    if (preferredPositions.includes('CENTER') && slotRole === 'C') return true;

    // Soccer cross-category flexibilities
    if (preferredPositions.includes('MID') && (slotCategory === 'DEF' || slotCategory === 'FWD')) return true;
    if (preferredPositions.includes('FWD') && slotCategory === 'MID') return true;
    if (preferredPositions.includes('DEF') && slotCategory === 'MID') return true;

    return false;
  }

  // 1. Assign Goalkeeper (Soccer only)
  const gkSlot = unassignedSlots.find(s => s.category === 'GK');
  if (gkSlot) {
    // If useStarters is enabled, prioritize starters who can play GK
    let bestGK: Player | undefined;

    if (useStarters) {
      const startingGKs = availablePlayers.filter(p => p.isStarter && p.canPlayGK);
      if (startingGKs.length > 0) {
        // If multiple starting GKs, pick the one with primary preference or highest skill
        bestGK = startingGKs.find(p => p.preferredPositions.includes('GK')) ||
                 [...startingGKs].sort((a, b) => b.skillLevel - a.skillLevel)[0];
      }
    }

    // Check tactical override FORCE GK
    if (!bestGK) {
      bestGK = availablePlayers.find(p => {
        const override = resultStates[p.id]?.tacticalOverride;
        return override?.type === 'FORCE' && override.targetCategory === 'GK' && p.canPlayGK;
      });
    }

    // Check tactical override FAVOR GK
    if (!bestGK) {
      bestGK = availablePlayers.find(p => {
        const override = resultStates[p.id]?.tacticalOverride;
        return override?.type === 'FAVOR' && override.targetCategory === 'GK' && p.canPlayGK;
      });
    }

    // Primary GK preferred
    if (!bestGK) {
      bestGK = availablePlayers.find(p => p.canPlayGK && p.preferredPositions.includes('GK'));
    }

    // Anyone who can play GK
    if (!bestGK) {
      bestGK = availablePlayers.find(p => p.canPlayGK);
    }

    // Ultimate fallback: highest skill player available
    if (!bestGK && availablePlayers.length > 0) {
      bestGK = [...availablePlayers].sort((a, b) => b.skillLevel - a.skillLevel)[0];
    }

    if (bestGK) {
      resultStates[bestGK.id] = {
        ...resultStates[bestGK.id],
        status: 'on_field',
        assignedSlotId: gkSlot.id,
        assignedRole: gkSlot.role,
      };
      const pIdx = availablePlayers.findIndex(p => p.id === bestGK!.id);
      if (pIdx !== -1) availablePlayers.splice(pIdx, 1);
      const sIdx = unassignedSlots.findIndex(s => s.id === gkSlot.id);
      if (sIdx !== -1) unassignedSlots.splice(sIdx, 1);
    }
  }

  // 2. Handle FORCE Overrides
  for (let i = availablePlayers.length - 1; i >= 0; i--) {
    const p = availablePlayers[i];
    const override = resultStates[p.id]?.tacticalOverride;
    if (override?.type === 'FORCE') {
      const matchingSlots = unassignedSlots.filter(
        s => getEffectiveSlotCategory(s, formation) === override.targetCategory
      );
      if (matchingSlots.length > 0) {
        let targetSlot: FormationSlot;
        if (p.skillLevel >= 7) {
          targetSlot = matchingSlots.find(s => isCenterPosition(s)) || matchingSlots[0];
        } else {
          targetSlot = matchingSlots.find(s => isWingPosition(s)) || matchingSlots[0];
        }

        resultStates[p.id] = {
          ...resultStates[p.id],
          status: 'on_field',
          assignedSlotId: targetSlot.id,
          assignedRole: targetSlot.role,
        };
        availablePlayers.splice(i, 1);
        const sIdx = unassignedSlots.findIndex(s => s.id === targetSlot.id);
        if (sIdx !== -1) unassignedSlots.splice(sIdx, 1);
      }
    }
  }

  // 3. Compute best fit matrix for remaining slots
  function calculateFit(player: Player, slot: FormationSlot, isStarterPass = false): number {
    let score = 0;
    const override = resultStates[player.id]?.tacticalOverride;
    const effectiveCategory = getEffectiveSlotCategory(slot, formation);

    // Starter bonus in starter pass
    if (isStarterPass && player.isStarter) {
      score += 100;
    }

    // FAVOR bonus
    if (override?.type === 'FAVOR' && override.targetCategory === effectiveCategory) {
      score += 25;
    }

    // Position match
    if (player.preferredPositions.includes(effectiveCategory)) {
      score += 24;
    } else if (isPositionCompatible(player.preferredPositions, effectiveCategory, slot.role)) {
      score += 10;
    }

    // Skill weighting (Center vs Wing nuance):
    if (isCenterPosition(slot)) {
      score += player.skillLevel * 2.5;
    } else if (isWingPosition(slot)) {
      score += (11 - player.skillLevel) * 1.8 + player.skillLevel * 0.5;
    } else {
      score += player.skillLevel * 1.5;
    }

    return score;
  }

  // Helper matching loop
  function assignOptimalPairs(pool: Player[], isStarterPass = false) {
    while (unassignedSlots.length > 0 && pool.length > 0) {
      let candidates: AssignmentCandidate[] = [];

      for (const player of pool) {
        for (const slot of unassignedSlots) {
          candidates.push({
            player,
            slot,
            score: calculateFit(player, slot, isStarterPass),
          });
        }
      }

      if (candidates.length === 0) break;

      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      if (!best) break;

      resultStates[best.player.id] = {
        ...resultStates[best.player.id],
        status: 'on_field',
        assignedSlotId: best.slot.id,
        assignedRole: best.slot.role,
      };

      // Remove player & slot from pools
      const pPoolIdx = pool.findIndex(p => p.id === best.player.id);
      if (pPoolIdx !== -1) pool.splice(pPoolIdx, 1);

      const pAvailIdx = availablePlayers.findIndex(p => p.id === best.player.id);
      if (pAvailIdx !== -1) availablePlayers.splice(pAvailIdx, 1);

      const sIdx = unassignedSlots.findIndex(s => s.id === best.slot.id);
      if (sIdx !== -1) unassignedSlots.splice(sIdx, 1);
    }
  }

  // If useStarters is enabled, partition and fill starters first!
  if (useStarters) {
    const startersPool = availablePlayers.filter(p => p.isStarter);
    if (startersPool.length > 0) {
      assignOptimalPairs(startersPool, true);
    }
  }

  // Fill any remaining unassigned slots with remaining available players
  assignOptimalPairs(availablePlayers, false);

  return resultStates;
}
