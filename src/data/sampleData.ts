import { Team } from '../types/soccer';

export const SAMPLE_TEAMS: Team[] = [
  {
    id: 'team-u10-lightning',
    name: 'Lightning FC (U10)',
    defaultPlayerCount: 7,
    primaryColor: '#2563eb', // Blue
    secondaryColor: '#facc15', // Gold
    createdAt: Date.now() - 86400000 * 7,
    players: [
      { id: 'p1', teamId: 'team-u10-lightning', name: 'Lucas Hayes', number: 1, skillLevel: 8, preferredPositions: ['GK'], canPlayGK: true, notes: 'Great reflexes and hands' },
      { id: 'p2', teamId: 'team-u10-lightning', name: 'Ethan Miller', number: 4, skillLevel: 7, preferredPositions: ['DEF'], canPlayGK: false, notes: 'Solid tackler' },
      { id: 'p3', teamId: 'team-u10-lightning', name: 'Noah Davis', number: 5, skillLevel: 6, preferredPositions: ['DEF'], canPlayGK: true, notes: 'Backup goalie' },
      { id: 'p4', teamId: 'team-u10-lightning', name: 'Liam Wilson', number: 6, skillLevel: 9, preferredPositions: ['MID'], canPlayGK: false, notes: 'Box-to-box playmaker' },
      { id: 'p5', teamId: 'team-u10-lightning', name: 'Oliver Taylor', number: 8, skillLevel: 7, preferredPositions: ['MID'], canPlayGK: false, notes: 'Good vision and passes' },
      { id: 'p6', teamId: 'team-u10-lightning', name: 'Mason Garcia', number: 10, skillLevel: 9, preferredPositions: ['FWD', 'MID'], canPlayGK: false, notes: 'Fast dribbler' },
      { id: 'p7', teamId: 'team-u10-lightning', name: 'Elijah Brown', number: 9, skillLevel: 8, preferredPositions: ['FWD'], canPlayGK: false, notes: 'Sharp finisher' },
      // Bench players
      { id: 'p8', teamId: 'team-u10-lightning', name: 'Aiden Jones', number: 2, skillLevel: 5, preferredPositions: ['DEF'], canPlayGK: false },
      { id: 'p9', teamId: 'team-u10-lightning', name: 'James White', number: 7, skillLevel: 6, preferredPositions: ['MID'], canPlayGK: false },
      { id: 'p10', teamId: 'team-u10-lightning', name: 'Benjamin Clark', number: 11, skillLevel: 6, preferredPositions: ['FWD'], canPlayGK: false },
      { id: 'p11', teamId: 'team-u10-lightning', name: 'Henry Adams', number: 14, skillLevel: 5, preferredPositions: ['DEF', 'MID'], canPlayGK: false },
    ],
  },
  {
    id: 'team-u12-firestorm',
    name: 'Firestorm (U12)',
    defaultPlayerCount: 9,
    primaryColor: '#dc2626', // Red
    secondaryColor: '#1e293b', // Dark slate
    createdAt: Date.now() - 86400000 * 5,
    players: [
      { id: 'f1', teamId: 'team-u12-firestorm', name: 'Jackson Reed', number: 1, skillLevel: 8, preferredPositions: ['GK'], canPlayGK: true },
      { id: 'f2', teamId: 'team-u12-firestorm', name: 'Samuel Harris', number: 3, skillLevel: 7, preferredPositions: ['DEF'], canPlayGK: false },
      { id: 'f3', teamId: 'team-u12-firestorm', name: 'Owen Martin', number: 4, skillLevel: 8, preferredPositions: ['DEF'], canPlayGK: false },
      { id: 'f4', teamId: 'team-u12-firestorm', name: 'Wyatt Thompson', number: 5, skillLevel: 6, preferredPositions: ['DEF'], canPlayGK: true },
      { id: 'f5', teamId: 'team-u12-firestorm', name: 'Leo Anderson', number: 6, skillLevel: 9, preferredPositions: ['MID'], canPlayGK: false },
      { id: 'f6', teamId: 'team-u12-firestorm', name: 'Julian Martinez', number: 8, skillLevel: 8, preferredPositions: ['MID'], canPlayGK: false },
      { id: 'f7', teamId: 'team-u12-firestorm', name: 'Gabriel Lopez', number: 7, skillLevel: 7, preferredPositions: ['FWD', 'MID'], canPlayGK: false },
      { id: 'f8', teamId: 'team-u12-firestorm', name: 'Mateo Gonzalez', number: 9, skillLevel: 9, preferredPositions: ['FWD'], canPlayGK: false },
      { id: 'f9', teamId: 'team-u12-firestorm', name: 'Caleb Walker', number: 11, skillLevel: 8, preferredPositions: ['FWD'], canPlayGK: false },
      // Bench
      { id: 'f10', teamId: 'team-u12-firestorm', name: 'Asher Hall', number: 2, skillLevel: 6, preferredPositions: ['DEF'], canPlayGK: false },
      { id: 'f11', teamId: 'team-u12-firestorm', name: 'Daniel Young', number: 12, skillLevel: 6, preferredPositions: ['MID'], canPlayGK: false },
      { id: 'f12', teamId: 'team-u12-firestorm', name: 'Matthew Allen', number: 14, skillLevel: 5, preferredPositions: ['MID', 'FWD'], canPlayGK: false },
      { id: 'f13', teamId: 'team-u12-firestorm', name: 'Luke King', number: 15, skillLevel: 6, preferredPositions: ['DEF'], canPlayGK: false },
    ],
  },
];
