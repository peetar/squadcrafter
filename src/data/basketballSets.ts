import { Formation } from '../types/soccer';

export const BASKETBALL_FORMATIONS: Formation[] = [
  {
    id: 'bb-5out',
    name: '5-Out Open (Recommended)',
    playerCount: 5,
    description: 'The modern youth basketball gold standard. Maximum court spacing, open lanes for driving, and equal touches for all players.',
    recommendedFor: 'Developing ball handling, passing, cutting, and court vision.',
    slots: [
      { id: 'point', role: 'PG', category: 'GUARD', label: 'Point', x: 50, y: 78 },
      { id: 'left_wing', role: 'SG', category: 'WING', label: 'Left Wing', x: 20, y: 52 },
      { id: 'right_wing', role: 'SF', category: 'WING', label: 'Right Wing', x: 80, y: 52 },
      { id: 'left_corner', role: 'PF', category: 'WING', label: 'Left Corner', x: 14, y: 24 },
      { id: 'right_corner', role: 'C', category: 'WING', label: 'Right Corner', x: 86, y: 24 },
    ],
  },
  {
    id: 'bb-4out-1in',
    name: '4-Out 1-In (Post & Perimeter)',
    playerCount: 5,
    description: 'Four perimeter handlers and cutters with one dedicated interior post player for rebounds and inside finishes.',
    recommendedFor: 'Teams with a strong rebounder or post scorer.',
    slots: [
      { id: 'point', role: 'PG', category: 'GUARD', label: 'Point Guard', x: 50, y: 78 },
      { id: 'left_wing', role: 'SG', category: 'WING', label: 'Left Wing', x: 22, y: 54 },
      { id: 'right_wing', role: 'SF', category: 'WING', label: 'Right Wing', x: 78, y: 54 },
      { id: 'corner', role: 'PF', category: 'WING', label: 'Corner / Wing', x: 84, y: 26 },
      { id: 'center', role: 'C', category: 'POST', label: 'Center (Low Post)', x: 42, y: 26 },
    ],
  },
  {
    id: 'bb-traditional',
    name: 'Traditional 1-5 (Classic)',
    playerCount: 5,
    description: 'Classic basketball lineup: 1 (Point Guard), 2 (Shooting Guard), 3 (Small Forward), 4 (Power Forward), and 5 (Center).',
    recommendedFor: 'Structured positional play and clear role definitions.',
    slots: [
      { id: 'pg', role: 'PG', category: 'GUARD', label: '1 - Point Guard', x: 50, y: 80 },
      { id: 'sg', role: 'SG', category: 'GUARD', label: '2 - Shooting Guard', x: 22, y: 54 },
      { id: 'sf', role: 'SF', category: 'WING', label: '3 - Small Forward', x: 78, y: 54 },
      { id: 'pf', role: 'PF', category: 'POST', label: '4 - Power Forward', x: 30, y: 28 },
      { id: 'c', role: 'C', category: 'POST', label: '5 - Center', x: 70, y: 28 },
    ],
  },
  {
    id: 'bb-2-3-zone',
    name: '2-3 Set / Zone',
    playerCount: 5,
    description: 'Two top guards pressuring ball movement, with three backline anchors protecting the paint and rebounding.',
    recommendedFor: 'Defensive rebounding, interior protection, and transition breaks.',
    slots: [
      { id: 'guard_l', role: 'PG', category: 'GUARD', label: 'Top Left Guard', x: 35, y: 66 },
      { id: 'guard_r', role: 'SG', category: 'GUARD', label: 'Top Right Guard', x: 65, y: 66 },
      { id: 'wing_l', role: 'SF', category: 'WING', label: 'Bottom Left', x: 18, y: 30 },
      { id: 'center_m', role: 'C', category: 'POST', label: 'Center Anchor', x: 50, y: 26 },
      { id: 'wing_r', role: 'PF', category: 'WING', label: 'Bottom Right', x: 82, y: 30 },
    ],
  },
  {
    id: 'bb-3v3',
    name: '3v3 Half-Court',
    playerCount: 3,
    description: 'Standard 3v3 layout for youth rec and development leagues.',
    recommendedFor: '3v3 tournaments, skills training, and younger rec divisions.',
    slots: [
      { id: 'top', role: 'PG', category: 'GUARD', label: 'Top', x: 50, y: 74 },
      { id: 'wing_l', role: 'SG', category: 'WING', label: 'Left Wing', x: 24, y: 44 },
      { id: 'wing_r', role: 'SF', category: 'WING', label: 'Right Wing', x: 76, y: 44 },
    ],
  },
];

export function getDefaultBasketballFormation(playerCount = 5): Formation {
  return BASKETBALL_FORMATIONS.find(f => f.playerCount === playerCount) || BASKETBALL_FORMATIONS[0];
}
