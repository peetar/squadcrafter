import { Formation } from './soccer';

export type SportType = 'soccer' | 'basketball' | 'baseball';

export type TimeTrackingMode = 'minutes' | 'periods';

export type ClockDirection = 'countup' | 'countdown';

export type PlaymakerAttribute = 
  | 'stopper'       // Soccer defensive rock / Basketball lockdown defender
  | 'scorer'        // Soccer attacker / finisher
  | 'ball_handler'  // Soccer possession mid / Basketball floor general
  | 'shooter'       // Basketball outside scoring threat
  | 'rebounder';    // Basketball rim protection & glass

export interface PlaymakerAttributeMeta {
  id: PlaymakerAttribute;
  label: string;
  icon: string;
  shortLabel: string;
  description: string;
  sports: SportType[];
}

export const PLAYMAKER_ATTRIBUTES: Record<PlaymakerAttribute, PlaymakerAttributeMeta> = {
  stopper: {
    id: 'stopper',
    label: 'Stopper',
    shortLabel: 'STP',
    icon: '🛡️',
    description: 'Defensive rock / lockdown defender who protects the back line',
    sports: ['soccer', 'basketball'],
  },
  scorer: {
    id: 'scorer',
    label: 'Scorer',
    shortLabel: 'SCR',
    icon: '🎯',
    description: 'Attacking threat / finisher who puts points on the board',
    sports: ['soccer'],
  },
  shooter: {
    id: 'shooter',
    label: 'Shooter',
    shortLabel: 'SHT',
    icon: '🏀',
    description: 'Perimeter scoring threat who stretches the floor',
    sports: ['basketball'],
  },
  ball_handler: {
    id: 'ball_handler',
    label: 'Ball Handler',
    shortLabel: 'BH',
    icon: '⚡',
    description: 'Reliable playmaker & floor general against pressure',
    sports: ['soccer', 'basketball'],
  },
  rebounder: {
    id: 'rebounder',
    label: 'Rebounder',
    shortLabel: 'REB',
    icon: '💪',
    description: 'Strong interior presence for rim protection and glass',
    sports: ['basketball'],
  },
};

export interface LineupBalanceWarning {
  id: string;
  type: 'warning' | 'info';
  message: string;
  missingAttribute: PlaymakerAttribute;
  targetCategory?: string;
  actionableHint?: string;
}

export interface SportPeriodOption {
  periodsTotal: number;
  periodDurationMinutes: number;
  periodName: string; // 'Halves', 'Quarters', 'Innings'
}

export interface SportDefinition {
  id: SportType;
  name: string;
  icon: string;
  courtType: 'pitch' | 'hardwood' | 'diamond';
  defaultPlayerCount: number;
  supportedPlayerCounts: number[];
  positionCategories: {
    id: string;
    label: string;
    roles: string[];
  }[];
  playmakerAttributes: PlaymakerAttribute[];
  defaultPeriodStructure: SportPeriodOption;
  periodOptions: SportPeriodOption[];
  formations: Formation[];
}
