import { Player, Formation, PlayerMatchState } from '../types/soccer';
import { SportType, PlaymakerAttribute, LineupBalanceWarning, PLAYMAKER_ATTRIBUTES } from '../types/sport';
import { getEffectiveSlotCategory } from '../data/formations';

/**
 * Validates the balance of players currently active on the field or court.
 * Returns an array of warnings if key playmaker attributes are completely absent.
 */
export function validateLineupBalance(
  sport: SportType,
  players: Player[],
  formation: Formation,
  playerStates: Record<string, PlayerMatchState>,
  warnMissingPlaymakers = true
): LineupBalanceWarning[] {
  if (!warnMissingPlaymakers) return [];

  const warnings: LineupBalanceWarning[] = [];

  // Get active on-field/on-court players with their assigned slots
  const activePlayersWithSlots = players
    .map(p => ({
      player: p,
      state: playerStates[p.id],
      slot: formation.slots.find(s => s.id === playerStates[p.id]?.assignedSlotId),
    }))
    .filter(item => item.state?.status === 'on_field' && item.slot);

  if (activePlayersWithSlots.length === 0) return [];

  if (sport === 'soccer') {
    // 1. Check Defense for 'stopper'
    const defSlots = activePlayersWithSlots.filter(item => {
      const cat = getEffectiveSlotCategory(item.slot!, formation);
      return cat === 'DEF';
    });

    if (defSlots.length > 0) {
      const hasStopperInDef = defSlots.some(item => 
        item.player.playmakerAttributes?.includes('stopper')
      );
      if (!hasStopperInDef) {
        warnings.push({
          id: 'missing-stopper-defense',
          type: 'warning',
          message: 'No Stopper in Defense',
          missingAttribute: 'stopper',
          targetCategory: 'DEF',
          actionableHint: 'The back line has no assigned Stopper. Consider putting a defensive anchor in defense.',
        });
      }
    }

    // 2. Check Attack for 'scorer'
    const attackSlots = activePlayersWithSlots.filter(item => {
      const cat = getEffectiveSlotCategory(item.slot!, formation);
      return cat === 'FWD';
    });

    if (attackSlots.length > 0) {
      const hasScorerInAttack = attackSlots.some(item => 
        item.player.playmakerAttributes?.includes('scorer')
      );
      if (!hasScorerInAttack) {
        warnings.push({
          id: 'missing-scorer-attack',
          type: 'warning',
          message: 'No Scorer in Attack',
          missingAttribute: 'scorer',
          targetCategory: 'FWD',
          actionableHint: 'The front line has no assigned Scorer. Consider putting a finisher up front.',
        });
      }
    }
  } else if (sport === 'basketball') {
    // 1. Check whole court for 'shooter'
    const hasShooter = activePlayersWithSlots.some(item => 
      item.player.playmakerAttributes?.includes('shooter')
    );
    if (!hasShooter) {
      warnings.push({
        id: 'missing-shooter',
        type: 'warning',
        message: 'No Shooter on the Court',
        missingAttribute: 'shooter',
        actionableHint: 'No active player has the Shooter attribute. Consider keeping an outside scorer on the floor.',
      });
    }

    // 2. Check whole court for 'ball_handler'
    const hasBallHandler = activePlayersWithSlots.some(item => 
      item.player.playmakerAttributes?.includes('ball_handler')
    );
    if (!hasBallHandler) {
      warnings.push({
        id: 'missing-ball-handler',
        type: 'warning',
        message: 'No Ball Handler on the Court',
        missingAttribute: 'ball_handler',
        actionableHint: 'No active player has the Ball Handler attribute. Consider keeping a floor general on the floor.',
      });
    }
  }

  return warnings;
}

/**
 * Checks whether replacing `playerOut` with `playerIn` leaves the active lineup
 * completely void of a required playmaker attribute.
 */
export function checkSubPlaymakerImpact(
  playerOut: Player,
  playerIn: Player,
  activePlayers: Player[],
  sport: SportType = 'soccer'
): { leavesMissingAttribute: boolean; attribute?: PlaymakerAttribute; label?: string } {
  // Attributes to protect
  const criticalAttributes: PlaymakerAttribute[] = 
    sport === 'basketball' 
      ? ['shooter', 'ball_handler'] 
      : ['stopper', 'scorer'];

  for (const attr of criticalAttributes) {
    const outHasIt = playerOut.playmakerAttributes?.includes(attr);
    const inHasIt = playerIn.playmakerAttributes?.includes(attr);

    if (outHasIt && !inHasIt) {
      // Count how many players currently on the field/court have this attribute
      const countOnCourt = activePlayers.filter(p => p.playmakerAttributes?.includes(attr)).length;
      if (countOnCourt <= 1) {
        const meta = PLAYMAKER_ATTRIBUTES[attr];
        return {
          leavesMissingAttribute: true,
          attribute: attr,
          label: meta?.label || attr,
        };
      }
    }
  }

  return { leavesMissingAttribute: false };
}
