import { Formation, FormationSlot, PositionCategory } from '../types/soccer';

export const FORMATIONS: Formation[] = [
  // ==================== 7v7 Formations ====================
  {
    id: '7v7-2-3-1',
    name: '2-3-1 (Recommended)',
    playerCount: 7,
    description: 'The US Soccer gold standard for U9/U10. Provides natural width, triangular passing angles, and clear defensive cover.',
    recommendedFor: 'Balanced development, passing triangles, and wide play.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left Defender', x: 30, y: 72 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right Defender', x: 70, y: 72 },
      { id: 'lm', role: 'LM', category: 'MID', label: 'Left Midfield', x: 18, y: 46 },
      { id: 'cm', role: 'CM', category: 'MID', label: 'Center Midfield', x: 50, y: 49 },
      { id: 'rm', role: 'RM', category: 'MID', label: 'Right Midfield', x: 82, y: 46 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Striker', x: 50, y: 20 },
    ],
  },
  {
    id: '7v7-3-2-1',
    name: '3-2-1 (Solid Defense)',
    playerCount: 7,
    description: 'Extra defensive stability with 3 at the back. Excellent for building out from the back against high-pressing teams.',
    recommendedFor: 'Defensive security and counter-attacks.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 22, y: 72 },
      { id: 'cb', role: 'CB', category: 'DEF', label: 'Center Back', x: 50, y: 75 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 78, y: 72 },
      { id: 'lcm', role: 'CM', category: 'MID', label: 'Left Mid', x: 35, y: 46 },
      { id: 'rcm', role: 'CM', category: 'MID', label: 'Right Mid', x: 65, y: 46 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Striker', x: 50, y: 20 },
    ],
  },
  {
    id: '7v7-2-2-2',
    name: '2-2-2 (Dual Striker)',
    playerCount: 7,
    description: 'Simple paired partnerships on each line. Easy for young kids to understand and keeps pressure on opponent defenders.',
    recommendedFor: 'Direct attacking and high pressing.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left Defender', x: 30, y: 72 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right Defender', x: 70, y: 72 },
      { id: 'lcm', role: 'CM', category: 'MID', label: 'Left Midfield', x: 33, y: 48 },
      { id: 'rcm', role: 'CM', category: 'MID', label: 'Right Midfield', x: 67, y: 48 },
      { id: 'lf', role: 'ST', category: 'FWD', label: 'Left Forward', x: 35, y: 22 },
      { id: 'rf', role: 'ST', category: 'FWD', label: 'Right Forward', x: 65, y: 22 },
    ],
  },
  {
    id: '7v7-3-1-2',
    name: '3-1-2 (Anchor Mid)',
    playerCount: 7,
    description: 'Combines a sturdy back 3 with a dedicated central playmaker anchor feeding two aggressive forwards.',
    recommendedFor: 'Solid spine with dual goal threats.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 22, y: 72 },
      { id: 'cb', role: 'CB', category: 'DEF', label: 'Center Back', x: 50, y: 75 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 78, y: 72 },
      { id: 'cm', role: 'CM', category: 'MID', label: 'Central Pivot', x: 50, y: 48 },
      { id: 'lf', role: 'ST', category: 'FWD', label: 'Left Striker', x: 35, y: 22 },
      { id: 'rf', role: 'ST', category: 'FWD', label: 'Right Striker', x: 65, y: 22 },
    ],
  },

  // ==================== 9v9 Formations ====================
  {
    id: '9v9-3-2-3',
    name: '3-2-3 (High Press & Wings)',
    playerCount: 9,
    description: 'Expansive and attacking. Provides true wingers (LW/RW) to isolate fullbacks and generate cross opportunities.',
    recommendedFor: 'Attacking football, winger development, and pressing.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 20, y: 72 },
      { id: 'cb', role: 'CB', category: 'DEF', label: 'Center Back', x: 50, y: 75 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 80, y: 72 },
      { id: 'lcm', role: 'CM', category: 'MID', label: 'Left Midfield', x: 35, y: 52 },
      { id: 'rcm', role: 'CM', category: 'MID', label: 'Right Midfield', x: 65, y: 52 },
      { id: 'lw', role: 'LW', category: 'FWD', label: 'Left Wing', x: 18, y: 26 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Center Striker', x: 50, y: 20 },
      { id: 'rw', role: 'RW', category: 'FWD', label: 'Right Wing', x: 82, y: 26 },
    ],
  },
  {
    id: '9v9-3-3-2',
    name: '3-3-2 (Balanced Control)',
    playerCount: 9,
    description: 'Most popular 9v9 setup in US youth leagues. Dominates the center with a 3-player midfield and dual strikers.',
    recommendedFor: 'Midfield control and balanced transitions.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 20, y: 72 },
      { id: 'cb', role: 'CB', category: 'DEF', label: 'Center Back', x: 50, y: 75 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 80, y: 72 },
      { id: 'lm', role: 'LM', category: 'MID', label: 'Left Mid', x: 18, y: 48 },
      { id: 'cm', role: 'CM', category: 'MID', label: 'Center Mid', x: 50, y: 50 },
      { id: 'rm', role: 'RM', category: 'MID', label: 'Right Mid', x: 82, y: 48 },
      { id: 'lf', role: 'ST', category: 'FWD', label: 'Left Striker', x: 36, y: 22 },
      { id: 'rf', role: 'ST', category: 'FWD', label: 'Right Striker', x: 64, y: 22 },
    ],
  },
  {
    id: '9v9-4-3-1',
    name: '4-3-1 (Back Four Prep)',
    playerCount: 9,
    description: 'Introduces a standard 4-player defensive backline (LB, 2 CBs, RB) to prepare players for the transition to 11v11.',
    recommendedFor: 'Defensive coordination and positional discipline.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 16, y: 74 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left CB', x: 38, y: 76 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right CB', x: 62, y: 76 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 84, y: 74 },
      { id: 'lm', role: 'LM', category: 'MID', label: 'Left Mid', x: 22, y: 48 },
      { id: 'cm', role: 'CM', category: 'MID', label: 'Center Mid', x: 50, y: 50 },
      { id: 'rm', role: 'RM', category: 'MID', label: 'Right Mid', x: 78, y: 48 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Striker', x: 50, y: 22 },
    ],
  },
  {
    id: '9v9-3-1-3-1',
    name: '3-1-3-1 (Dutch Diamond)',
    playerCount: 9,
    description: 'Features a defensive screen CDM, central CAM playmaker, and active wingers. Encourages high soccer IQ passing.',
    recommendedFor: 'Technical passing teams and tactical versatility.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 22, y: 74 },
      { id: 'cb', role: 'CB', category: 'DEF', label: 'Center Back', x: 50, y: 76 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 78, y: 74 },
      { id: 'cdm', role: 'CDM', category: 'MID', label: 'Holding Mid', x: 50, y: 60 },
      { id: 'lm', role: 'LM', category: 'MID', label: 'Left Wing Mid', x: 18, y: 42 },
      { id: 'cam', role: 'CAM', category: 'MID', label: 'Playmaker', x: 50, y: 38 },
      { id: 'rm', role: 'RM', category: 'MID', label: 'Right Wing Mid', x: 82, y: 42 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Striker', x: 50, y: 18 },
    ],
  },

  // ==================== 11v11 Formations ====================
  {
    id: '11v11-4-3-3',
    name: '4-3-3 (Modern Development)',
    playerCount: 11,
    description: 'The premier modern formation endorsed worldwide. Focuses on triangles, pressing, high wingers, and positional flexibility.',
    recommendedFor: 'Possession style, wide isolation, and proactive play.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 14, y: 75 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left Center Back', x: 38, y: 78 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right Center Back', x: 62, y: 78 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 86, y: 75 },
      { id: 'lcm', role: 'CM', category: 'MID', label: 'Left Mid', x: 28, y: 52 },
      { id: 'cdm', role: 'CDM', category: 'MID', label: 'Central Pivot', x: 50, y: 57 },
      { id: 'rcm', role: 'CM', category: 'MID', label: 'Right Mid', x: 72, y: 52 },
      { id: 'lw', role: 'LW', category: 'FWD', label: 'Left Wing', x: 18, y: 25 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Striker', x: 50, y: 18 },
      { id: 'rw', role: 'RW', category: 'FWD', label: 'Right Wing', x: 82, y: 25 },
    ],
  },
  {
    id: '11v11-4-4-2',
    name: '4-4-2 (Classic Structure)',
    playerCount: 11,
    description: 'Disciplined and compact. Two flat lines of 4 provide clear defensive cover, partnered with dual forwards.',
    recommendedFor: 'Compact defending, wing crosses, and striker partnerships.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 14, y: 75 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left Center Back', x: 38, y: 78 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right Center Back', x: 62, y: 78 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 86, y: 75 },
      { id: 'lm', role: 'LM', category: 'MID', label: 'Left Mid', x: 16, y: 48 },
      { id: 'lcm', role: 'CM', category: 'MID', label: 'Left Center Mid', x: 38, y: 50 },
      { id: 'rcm', role: 'CM', category: 'MID', label: 'Right Center Mid', x: 62, y: 50 },
      { id: 'rm', role: 'RM', category: 'MID', label: 'Right Mid', x: 84, y: 48 },
      { id: 'lf', role: 'ST', category: 'FWD', label: 'Left Striker', x: 36, y: 20 },
      { id: 'rf', role: 'ST', category: 'FWD', label: 'Right Striker', x: 64, y: 20 },
    ],
  },
  {
    id: '11v11-4-2-3-1',
    name: '4-2-3-1 (Double Pivot)',
    playerCount: 11,
    description: 'Features two holding midfielders protecting the defense, allowing three attacking midfielders freedom to create.',
    recommendedFor: 'Defensive shielding with creative attacking flair.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lb', role: 'LB', category: 'DEF', label: 'Left Back', x: 14, y: 75 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left CB', x: 38, y: 78 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right CB', x: 62, y: 78 },
      { id: 'rb', role: 'RB', category: 'DEF', label: 'Right Back', x: 86, y: 75 },
      { id: 'ldm', role: 'CDM', category: 'MID', label: 'Left Pivot', x: 36, y: 60 },
      { id: 'rdm', role: 'CDM', category: 'MID', label: 'Right Pivot', x: 64, y: 60 },
      { id: 'lam', role: 'LM', category: 'MID', label: 'Left AM', x: 18, y: 40 },
      { id: 'cam', role: 'CAM', category: 'FWD', label: 'Playmaker CAM', x: 50, y: 36 },
      { id: 'ram', role: 'RM', category: 'MID', label: 'Right AM', x: 82, y: 40 },
      { id: 'st', role: 'ST', category: 'FWD', label: 'Lone Striker', x: 50, y: 18 },
    ],
  },
  {
    id: '11v11-3-5-2',
    name: '3-5-2 (Wing-Back Overload)',
    playerCount: 11,
    description: 'Dynamic wingbacks run the entire flank, creating superior numbers across the midfield.',
    recommendedFor: 'Athletic teams with strong stamina and wing play.',
    slots: [
      { id: 'gk', role: 'GK', category: 'GK', label: 'Goalkeeper', x: 50, y: 89 },
      { id: 'lcb', role: 'CB', category: 'DEF', label: 'Left CB', x: 26, y: 76 },
      { id: 'cb', role: 'CB', category: 'DEF', label: 'Center CB', x: 50, y: 78 },
      { id: 'rcb', role: 'CB', category: 'DEF', label: 'Right CB', x: 74, y: 76 },
      { id: 'lwb', role: 'LWB', category: 'MID', label: 'Left Wing-Back', x: 12, y: 50 },
      { id: 'lcm', role: 'CM', category: 'MID', label: 'Left Mid', x: 33, y: 52 },
      { id: 'cam', role: 'CAM', category: 'MID', label: 'Central AM', x: 50, y: 42 },
      { id: 'rcm', role: 'CM', category: 'MID', label: 'Right Mid', x: 67, y: 52 },
      { id: 'rwb', role: 'RWB', category: 'MID', label: 'Right Wing-Back', x: 88, y: 50 },
      { id: 'lf', role: 'ST', category: 'FWD', label: 'Left Striker', x: 36, y: 20 },
      { id: 'rf', role: 'ST', category: 'FWD', label: 'Right Striker', x: 64, y: 20 },
    ],
  },
];

export function getFormationsByPlayerCount(count: number): Formation[] {
  const matching = FORMATIONS.filter(f => f.playerCount === count);
  if (matching.length > 0) return matching;
  // Default to 7v7, 9v9, or 11v11 closest
  if (count <= 7) return FORMATIONS.filter(f => f.playerCount === 7);
  if (count <= 9) return FORMATIONS.filter(f => f.playerCount === 9);
  return FORMATIONS.filter(f => f.playerCount === 11);
}

export function getDefaultFormation(count: number): Formation {
  const list = getFormationsByPlayerCount(count);
  return list[0] || FORMATIONS[0];
}

/**
 * In a 4-2-3-1 formation, the attacking mid (CAM) is considered a forward (FWD), not mid.
 */
export function getEffectiveSlotCategory(slot: FormationSlot, formation?: Formation): PositionCategory {
  if (
    (formation?.id.includes('4-2-3-1') || slot.id === 'cam') &&
    (slot.role === 'CAM' || slot.id === 'cam')
  ) {
    return 'FWD';
  }
  return slot.category;
}

/**
 * Checks if a slot is located on the touchline wings/flanks:
 * Fullbacks (LB, RB), Wingbacks (LWB, RWB), Wide Midfielders (LM, RM), Wingers (LW, RW, LAM, RAM).
 */
export function isWingPosition(slot: FormationSlot): boolean {
  if (slot.category === 'GK' || slot.role === 'GK') return false;

  const wingRoles = ['LB', 'RB', 'LWB', 'RWB', 'LM', 'RM', 'LW', 'RW'];
  if (wingRoles.includes(slot.role)) return true;

  if (slot.id === 'lam' || slot.id === 'ram') return true;

  // Outer flanks by coordinate (<= 25% or >= 75%) unless explicitly a central role (CB, CM, CDM, CAM, ST, CF)
  if ((slot.x <= 25 || slot.x >= 75) && !['CB', 'CM', 'CDM', 'CAM', 'ST', 'CF'].includes(slot.role)) {
    return true;
  }

  return false;
}

/**
 * Checks if a slot is located along the central spine:
 * Center Backs (CB), Central Midfielders (CM, CDM, CAM), and Strikers/Center Forwards (ST, CF).
 */
export function isCenterPosition(slot: FormationSlot): boolean {
  if (slot.category === 'GK' || slot.role === 'GK') return false;
  return !isWingPosition(slot);
}
