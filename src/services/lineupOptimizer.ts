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
  existingStates?: Record<string, PlayerMatchState>
): Record<string, PlayerMatchState> {
  const resultStates: Record<string, PlayerMatchState> = {};

  // Initialize base state for every player
  players.forEach(p => {
    const existing = existingStates?.[p.id];
    resultStates[p.id] = {
      playerId: p.id,
      status: 'on_bench',
      assignedSlotId: undefined,
      assignedRole: undefined,
      totalFieldSeconds: existing?.totalFieldSeconds || 0,
      totalBenchSeconds: existing?.totalBenchSeconds || 0,
      currentStintSeconds: existing?.currentStintSeconds || 0,
      isTired: existing?.isTired || false,
      goals: existing?.goals || 0,
      tacticalOverride: existing?.tacticalOverride,
    };
  });

  const availablePlayers = [...players];
  const unassignedSlots = [...formation.slots];

  // 1. Assign Goalkeeper
  const gkSlot = unassignedSlots.find(s => s.category === 'GK');
  if (gkSlot) {
    // Check if any player has FORCE GK
    let bestGK = availablePlayers.find(p => {
      const override = resultStates[p.id]?.tacticalOverride;
      return override?.type === 'FORCE' && override.targetCategory === 'GK' && p.canPlayGK;
    });

    // Check if any player favors GK and can play GK
    if (!bestGK) {
      bestGK = availablePlayers.find(p => {
        const override = resultStates[p.id]?.tacticalOverride;
        return override?.type === 'FAVOR' && override.targetCategory === 'GK' && p.canPlayGK;
      });
    }

    // Check primary GK preferred
    if (!bestGK) {
      bestGK = availablePlayers.find(p => p.canPlayGK && p.preferredPositions.includes('GK'));
    }

    // Fallback: anyone who can play GK
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
      // Remove assigned
      const pIdx = availablePlayers.findIndex(p => p.id === bestGK!.id);
      if (pIdx !== -1) availablePlayers.splice(pIdx, 1);
      const sIdx = unassignedSlots.findIndex(s => s.id === gkSlot.id);
      if (sIdx !== -1) unassignedSlots.splice(sIdx, 1);
    }
  }

  // 2. Handle FORCE Outfield Overrides
  for (let i = availablePlayers.length - 1; i >= 0; i--) {
    const p = availablePlayers[i];
    const override = resultStates[p.id]?.tacticalOverride;
    if (override?.type === 'FORCE') {
      // Find open slots in target category (respecting 4-2-3-1 CAM as FWD)
      const matchingSlots = unassignedSlots.filter(
        s => getEffectiveSlotCategory(s, formation) === override.targetCategory
      );
      if (matchingSlots.length > 0) {
        // High skill players prefer central roles; lower skill players prefer wings
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
  // For each remaining player and remaining slot, calculate compatibility score
  function calculateFit(player: Player, slot: FormationSlot): number {
    let score = 0;
    const override = resultStates[player.id]?.tacticalOverride;
    const effectiveCategory = getEffectiveSlotCategory(slot, formation);

    // FAVOR bonus
    if (override?.type === 'FAVOR' && override.targetCategory === effectiveCategory) {
      score += 25;
    }

    // Position match
    if (player.preferredPositions.includes(effectiveCategory)) {
      score += 22;
    } else if (
      // Close category compatibility
      (player.preferredPositions.includes('MID') && (effectiveCategory === 'DEF' || effectiveCategory === 'FWD')) ||
      (player.preferredPositions.includes('FWD') && effectiveCategory === 'MID') ||
      (player.preferredPositions.includes('DEF') && effectiveCategory === 'MID')
    ) {
      score += 8;
    }

    // Skill weighting (Center vs Wing nuance):
    // Central positions (CB, CM, CAM, CDM, ST) prefer higher-skilled players.
    // Flanks / Wings (LB, RB, LM, RM, LW, RW, etc.) prefer lower-skilled / developmental players.
    if (isCenterPosition(slot)) {
      score += player.skillLevel * 2.5;
    } else if (isWingPosition(slot)) {
      score += (11 - player.skillLevel) * 1.8 + player.skillLevel * 0.5;
    } else {
      score += player.skillLevel * 1.5;
    }

    return score;
  }

  // Greedy match highest scoring pairs until all slots filled or players run out
  while (unassignedSlots.length > 0 && availablePlayers.length > 0) {
    let candidates: AssignmentCandidate[] = [];

    for (const player of availablePlayers) {
      for (const slot of unassignedSlots) {
        candidates.push({
          player,
          slot,
          score: calculateFit(player, slot),
        });
      }
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    if (!best) break;

    resultStates[best.player.id] = {
      ...resultStates[best.player.id],
      status: 'on_field',
      assignedSlotId: best.slot.id,
      assignedRole: best.slot.role,
    };

    // Remove player & slot
    const pIdx = availablePlayers.findIndex(p => p.id === best.player.id);
    if (pIdx !== -1) availablePlayers.splice(pIdx, 1);
    const sIdx = unassignedSlots.findIndex(s => s.id === best.slot.id);
    if (sIdx !== -1) unassignedSlots.splice(sIdx, 1);
  }

  // Any remaining players stay on_bench (already initialized)
  return resultStates;
}
