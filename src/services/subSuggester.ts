import { Player, Formation, PlayerMatchState, QueuedSub } from '../types/soccer';
import { getEffectiveSlotCategory, isWingPosition, isCenterPosition } from '../data/formations';

export interface SubRecommendation {
  playerIn: Player;
  playerOut: Player;
  targetSlotId: string;
  role: string;
  score: number;
  reason: string;
}

/**
 * Suggests the best bench candidates to replace a specific on-field player.
 */
export function suggestSubsForFieldPlayer(
  playerOut: Player,
  players: Player[],
  formation: Formation,
  playerStates: Record<string, PlayerMatchState>,
  cleanGoalieSwaps: boolean
): SubRecommendation[] {
  const outState = playerStates[playerOut.id];
  if (!outState || outState.status !== 'on_field' || !outState.assignedSlotId) {
    return [];
  }

  const currentSlot = formation.slots.find(s => s.id === outState.assignedSlotId);
  if (!currentSlot) return [];

  const isGK = currentSlot.category === 'GK';

  // Find eligible bench players
  const benchPlayers = players.filter(p => {
    const s = playerStates[p.id];
    if (!s || s.status !== 'on_bench') return false;

    // Clean goalie swap rule:
    if (cleanGoalieSwaps) {
      if (isGK) {
        // Only someone who can play GK
        return p.canPlayGK;
      } else {
        // If out player is outfield, do not sub in a dedicated GK who cannot play outfield
        if (p.preferredPositions.length === 1 && p.preferredPositions[0] === 'GK') {
          return false;
        }
      }
    }
    return true;
  });

  const recommendations: SubRecommendation[] = benchPlayers.map(pIn => {
    const inState = playerStates[pIn.id];
    let score = 0;
    const reasons: string[] = [];

    // 1. Bench sit time (vital for youth soccer fair play)
    const sitMinutes = Math.floor((inState?.currentStintSeconds || 0) / 60);
    score += sitMinutes * 4;
    if (sitMinutes >= 8) {
      reasons.push(`Sitting ${sitMinutes}m`);
    }

    // 2. Position compatibility
    const effectiveCategory = getEffectiveSlotCategory(currentSlot, formation);
    const override = inState?.tacticalOverride;
    if (override?.type === 'FORCE' && override.targetCategory === effectiveCategory) {
      score += 30;
      reasons.push(`Forced to ${effectiveCategory}`);
    } else if (override?.type === 'FAVOR' && override.targetCategory === effectiveCategory) {
      score += 20;
      reasons.push(`Favors ${effectiveCategory}`);
    } else if (pIn.preferredPositions.includes(effectiveCategory)) {
      score += 15;
      if (effectiveCategory === 'FWD' && (currentSlot.id === 'cam' || currentSlot.role === 'CAM')) {
        reasons.push('Attacking Mid (FWD)');
      } else {
        reasons.push(`Plays ${effectiveCategory}`);
      }
    } else if (
      (pIn.preferredPositions.includes('MID') && (effectiveCategory === 'DEF' || effectiveCategory === 'FWD')) ||
      (pIn.preferredPositions.includes('FWD') && effectiveCategory === 'MID') ||
      (pIn.preferredPositions.includes('DEF') && effectiveCategory === 'MID')
    ) {
      score += 6;
      reasons.push('Versatile fit');
    } else if (isGK && pIn.canPlayGK) {
      score += 25;
      reasons.push('Can play GK');
    }

    // 3. Nuanced Skill Weighting (Center vs Wing)
    if (isCenterPosition(currentSlot)) {
      score += (pIn.skillLevel - 5) * 2.0;
      if (pIn.skillLevel >= 7) {
        reasons.push('Central spine skill');
      }
    } else if (isWingPosition(currentSlot)) {
      score += (10 - pIn.skillLevel) * 1.8;
      if (pIn.skillLevel <= 5) {
        reasons.push('Wing development fit');
      }
    }

    // 4. Fairness in total field time
    const totalBenchMinutes = Math.floor((inState?.totalBenchSeconds || 0) / 60);
    score += totalBenchMinutes * 1.5;

    return {
      playerIn: pIn,
      playerOut,
      targetSlotId: currentSlot.id,
      role: currentSlot.role,
      score,
      reason: reasons.join(' • ') || 'Ready on bench',
    };
  });

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Suggests the best on-field player to sub out when a bench player is selected.
 */
export function suggestSubsForBenchPlayer(
  playerIn: Player,
  players: Player[],
  formation: Formation,
  playerStates: Record<string, PlayerMatchState>,
  cleanGoalieSwaps: boolean
): SubRecommendation[] {
  const inState = playerStates[playerIn.id];
  if (!inState || inState.status !== 'on_bench') return [];

  const fieldPlayers = players.filter(p => {
    const s = playerStates[p.id];
    return s && s.status === 'on_field' && s.assignedSlotId;
  });

  const recommendations: SubRecommendation[] = [];

  for (const pOut of fieldPlayers) {
    const outState = playerStates[pOut.id];
    const slot = formation.slots.find(s => s.id === outState.assignedSlotId);
    if (!slot) continue;

    const isGK = slot.category === 'GK';

    // Clean goalie swaps rule
    if (cleanGoalieSwaps) {
      if (isGK && !playerIn.canPlayGK) continue;
      if (!isGK && playerIn.preferredPositions.length === 1 && playerIn.preferredPositions[0] === 'GK') continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // 1. Tired status is top priority!
    if (outState.isTired) {
      score += 50;
      reasons.push('Tired player');
    }

    // 2. On-field stint length
    const stintMinutes = Math.floor(outState.currentStintSeconds / 60);
    score += stintMinutes * 3;
    if (stintMinutes >= 10) {
      reasons.push(`On pitch ${stintMinutes}m`);
    }

    const effectiveCategory = getEffectiveSlotCategory(slot, formation);

    // 3. Position fit
    if (playerIn.preferredPositions.includes(effectiveCategory)) {
      score += 15;
      if (effectiveCategory === 'FWD' && (slot.id === 'cam' || slot.role === 'CAM')) {
        reasons.push('Attacking Mid fit (FWD)');
      } else {
        reasons.push(`Fit for ${slot.role}`);
      }
    } else if (
      (playerIn.preferredPositions.includes('MID') && (effectiveCategory === 'DEF' || effectiveCategory === 'FWD')) ||
      (playerIn.preferredPositions.includes('FWD') && effectiveCategory === 'MID') ||
      (playerIn.preferredPositions.includes('DEF') && effectiveCategory === 'MID')
    ) {
      score += 6;
      reasons.push('Versatile fit');
    }

    // 4. Nuanced Skill Weighting (Center vs Wing)
    if (isCenterPosition(slot)) {
      score += (playerIn.skillLevel - 5) * 2.5;
      if (playerIn.skillLevel >= 7) {
        reasons.push('Impact central role');
      }
    } else if (isWingPosition(slot)) {
      score += (10 - playerIn.skillLevel) * 2.0;
      if (playerIn.skillLevel <= 5) {
        reasons.push('Wing development role');
      }
    }

    // 5. Total playing time balance
    const fieldMinutes = Math.floor(outState.totalFieldSeconds / 60);
    score += fieldMinutes * 1.5;

    recommendations.push({
      playerIn,
      playerOut: pOut,
      targetSlotId: slot.id,
      role: slot.role,
      score,
      reason: reasons.join(' • ') || `Sub for ${slot.role}`,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Suggests a full bench swap (mass sub).
 * Pairs all available bench players with the most tired or longest-playing field players.
 */
export function suggestFullBenchSwap(
  players: Player[],
  formation: Formation,
  playerStates: Record<string, PlayerMatchState>,
  cleanGoalieSwaps: boolean
): SubRecommendation[] {
  const benchPlayers = players.filter(p => playerStates[p.id]?.status === 'on_bench');
  const fieldPlayers = players.filter(p => playerStates[p.id]?.status === 'on_field');

  if (benchPlayers.length === 0 || fieldPlayers.length === 0) {
    return [];
  }

  // Sort bench players descending by sit time (longest sitting gets priority)
  const sortedBench = [...benchPlayers].sort((a, b) => {
    const sitA = playerStates[a.id]?.currentStintSeconds || 0;
    const sitB = playerStates[b.id]?.currentStintSeconds || 0;
    return sitB - sitA;
  });

  // Eligible field players to sub out
  let eligibleField = fieldPlayers.filter(p => {
    const slotId = playerStates[p.id]?.assignedSlotId;
    const slot = formation.slots.find(s => s.id === slotId);
    if (!slot) return false;
    if (cleanGoalieSwaps && slot.category === 'GK') return false; // Preserve GK
    return true;
  });

  // Sort field players by priority to come off:
  // 1. isTired === true
  // 2. current stint seconds (highest)
  // 3. total field seconds (highest)
  eligibleField.sort((a, b) => {
    const sA = playerStates[a.id]!;
    const sB = playerStates[b.id]!;
    if (sA.isTired !== sB.isTired) {
      return sA.isTired ? -1 : 1;
    }
    if (sB.currentStintSeconds !== sA.currentStintSeconds) {
      return sB.currentStintSeconds - sA.currentStintSeconds;
    }
    return sB.totalFieldSeconds - sA.totalFieldSeconds;
  });

  const pairings: SubRecommendation[] = [];
  const remainingField = [...eligibleField];

  for (const bPlayer of sortedBench) {
    if (remainingField.length === 0) break;

    // Find the best matching field player among those needing to come off
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remainingField.length; i++) {
      const fPlayer = remainingField[i];
      const slot = formation.slots.find(s => s.id === playerStates[fPlayer.id]?.assignedSlotId);
      if (!slot) continue;

      const effectiveCategory = getEffectiveSlotCategory(slot, formation);
      let matchScore = 0;
      // Position fit
      if (bPlayer.preferredPositions.includes(effectiveCategory)) matchScore += 20;
      // Preference for subbing tired player
      if (playerStates[fPlayer.id]?.isTired) matchScore += 30;
      // Field time
      matchScore += Math.floor((playerStates[fPlayer.id]?.currentStintSeconds || 0) / 60) * 3;

      // Skill role preference: higher skill in center, lower skill on wings
      if (isCenterPosition(slot)) {
        matchScore += (bPlayer.skillLevel - 5) * 2.5;
      } else if (isWingPosition(slot)) {
        matchScore += (10 - bPlayer.skillLevel) * 2.0;
      }

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestIndex = i;
      }
    }

    const matchedField = remainingField[bestIndex];
    const targetSlot = formation.slots.find(s => s.id === playerStates[matchedField.id]?.assignedSlotId)!;

    const reasons: string[] = [];
    if (playerStates[matchedField.id]?.isTired) reasons.push('Tired player');
    const sitMins = Math.floor((playerStates[bPlayer.id]?.currentStintSeconds || 0) / 60);
    if (sitMins > 0) reasons.push(`Sat ${sitMins}m`);
    if (bPlayer.skillLevel >= 7 && isCenterPosition(targetSlot)) reasons.push('Central spine');
    if (bPlayer.skillLevel <= 5 && isWingPosition(targetSlot)) reasons.push('Wing rotation');

    pairings.push({
      playerIn: bPlayer,
      playerOut: matchedField,
      targetSlotId: targetSlot.id,
      role: targetSlot.role,
      score: bestScore,
      reason: reasons.join(' • ') || 'Full bench rotation',
    });

    remainingField.splice(bestIndex, 1);
  }

  return pairings;
}
