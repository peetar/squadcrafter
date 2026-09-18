export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD';

export type SpecificRole = 
  | 'GK' 
  | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB' 
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' 
  | 'LW' | 'RW' | 'ST' | 'CF';

export interface Player {
  id: string;
  teamId: string;
  name: string;
  number: number;
  skillLevel: number; // 1 to 10 (Strictly hidden from game/pitch screens!)
  preferredPositions: PositionCategory[];
  canPlayGK: boolean;
  notes?: string;
}

export type TacticalOverrideType = 'FORCE' | 'FAVOR' | 'NONE';

export interface TacticalOverride {
  type: TacticalOverrideType;
  targetCategory: PositionCategory;
}

export interface PlayerMatchState {
  playerId: string;
  status: 'on_field' | 'on_bench' | 'absent';
  assignedSlotId?: string; // Slot ID on the pitch
  assignedRole?: string;   // e.g. 'ST', 'CM', 'CB', 'GK'
  totalFieldSeconds: number;
  totalBenchSeconds: number;
  currentStintSeconds: number; // Duration of current continuous stint on field or bench
  isTired: boolean;
  goals: number;
  tacticalOverride?: TacticalOverride;
}

export interface FormationSlot {
  id: string;
  role: string;
  category: PositionCategory;
  x: number; // 0% (left touchline) to 100% (right touchline)
  y: number; // 0% (opponent goal line/top) to 100% (own goal line/bottom)
  label: string;
}

export interface Formation {
  id: string;
  name: string;
  playerCount: number; // 7, 9, 11
  description: string;
  recommendedFor: string;
  slots: FormationSlot[];
}

export type SubstitutionMode = 'free' | 'quarters';

export interface QueuedSub {
  id: string;
  playerOutId: string; // Active on pitch
  playerInId: string;  // Coming from bench
  targetSlotId: string; // Position being occupied
  timestamp: number;
}

export type MatchStatus = 'setup' | 'running' | 'paused' | 'period_break' | 'finished';

export interface MatchEvent {
  id: string;
  gameId: string;
  matchSecond: number;
  period: number;
  type: 'goal' | 'sub' | 'tired' | 'period_start' | 'period_end';
  playerId?: string;
  playerInId?: string;
  playerOutId?: string;
  description: string;
  timestamp: number;
}

export interface Game {
  id: string;
  teamId: string;
  opponentName: string;
  date: string;
  formatPlayerCount: number; // 7, 9, 11
  formationId: string;
  subMode: SubstitutionMode;
  cleanGoalieSwaps: boolean; // Keep GK locked during outfield rotations
  periodsTotal: number;      // 2 for halves, 4 for quarters
  currentPeriod: number;     // 1 to 4
  periodDurationMinutes: number; // e.g. 25 min (halves) or 12 min (quarters)
  status: MatchStatus;
  elapsedPeriodSeconds: number;
  totalElapsedSeconds: number;
  playerStates: Record<string, PlayerMatchState>;
  queuedSubs: QueuedSub[];
  events: MatchEvent[];
  scoreUs: number;
  scoreThem: number;
}

export interface Team {
  id: string;
  name: string;
  defaultPlayerCount: number; // 7, 9, 11
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  createdAt: number;
}
