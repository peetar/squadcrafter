import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Team, 
  Player, 
  Game, 
  PlayerMatchState, 
  QueuedSub, 
  MatchStatus, 
  TacticalOverride, 
  SubstitutionMode,
  MatchEvent,
  PositionCategory
} from '../types/soccer';
import { SportType, TimeTrackingMode, ClockDirection } from '../types/sport';
import { SAMPLE_TEAMS } from '../data/sampleData';
import { FORMATIONS, getDefaultFormation } from '../data/formations';
import { BASKETBALL_FORMATIONS, getDefaultBasketballFormation } from '../data/basketballSets';
import { autoFillLineup } from '../services/lineupOptimizer';

const STORAGE_KEY = 'squadcrafter_app_state_v1';

export interface AppState {
  teams: Team[];
  activeTeamId: string | null;
  activeGame: Game | null;
  savedGames: Game[];
}

/**
 * Lineup Integrity Sanitizer
 * Ensures:
 * 1. Every 'on_field' player is assigned to a valid slot in the game's active formation.
 * 2. No two players share the same slot (if a collision occurs, the duplicate is placed in a vacant slot or booted to bench).
 * 3. All 'on_bench' or 'absent' players have assignedSlotId & assignedRole cleared.
 * 4. Queued subs are strictly between a valid bench player and a valid field player.
 */
export function reconcileLineupIntegrity(game: Game): Game {
  const allFormations = [...FORMATIONS, ...BASKETBALL_FORMATIONS];
  const formation = allFormations.find(f => f.id === game.formationId);
  if (!formation) return game;

  const validSlotIds = new Set(formation.slots.map(s => s.id));
  const updatedPlayerStates: Record<string, PlayerMatchState> = { ...game.playerStates };
  let hasChanges = false;

  // Track which slot has been claimed by an active on_field player (slotId -> playerId)
  const occupiedSlots = new Map<string, string>();
  const problematicFieldPlayers: string[] = [];

  // Pass 1: Validate each player's status and assigned slot
  for (const [playerId, state] of Object.entries(updatedPlayerStates)) {
    if (state.status === 'on_field') {
      const slotId = state.assignedSlotId;
      if (slotId && validSlotIds.has(slotId) && !occupiedSlots.has(slotId)) {
        occupiedSlots.set(slotId, playerId);
        const slotObj = formation.slots.find(s => s.id === slotId);
        if (slotObj && state.assignedRole !== slotObj.role) {
          updatedPlayerStates[playerId] = {
            ...state,
            assignedRole: slotObj.role,
          };
          hasChanges = true;
        }
      } else {
        // Missing, invalid, or duplicate slot
        problematicFieldPlayers.push(playerId);
      }
    } else {
      // Bench or absent players MUST NOT retain pitch slot references
      if (state.assignedSlotId !== undefined || state.assignedRole !== undefined) {
        updatedPlayerStates[playerId] = {
          ...state,
          assignedSlotId: undefined,
          assignedRole: undefined,
        };
        hasChanges = true;
      }
    }
  }

  // Pass 2: Reconcile problematic field players
  if (problematicFieldPlayers.length > 0) {
    hasChanges = true;
    const vacantSlots = formation.slots.filter(s => !occupiedSlots.has(s.id));

    for (const playerId of problematicFieldPlayers) {
      const state = updatedPlayerStates[playerId];
      if (vacantSlots.length > 0) {
        // Place in an available vacant slot on the pitch
        const slotToTake = vacantSlots.shift()!;
        occupiedSlots.set(slotToTake.id, playerId);
        updatedPlayerStates[playerId] = {
          ...state,
          status: 'on_field',
          assignedSlotId: slotToTake.id,
          assignedRole: slotToTake.role,
        };
      } else {
        // No room in starting lineup: safely boot to bench so coach can see and sub them
        updatedPlayerStates[playerId] = {
          ...state,
          status: 'on_bench',
          assignedSlotId: undefined,
          assignedRole: undefined,
        };
      }
    }
  }

  // Pass 3: Validate queued substitutions
  const validQueuedSubs = game.queuedSubs.filter(q => {
    const inState = updatedPlayerStates[q.playerInId];
    const outState = updatedPlayerStates[q.playerOutId];
    return (
      inState &&
      inState.status === 'on_bench' &&
      outState &&
      outState.status === 'on_field'
    );
  });

  if (validQueuedSubs.length !== game.queuedSubs.length) {
    hasChanges = true;
  }

  if (!hasChanges) return game;

  return {
    ...game,
    playerStates: updatedPlayerStates,
    queuedSubs: validQueuedSubs,
  };
}

function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.teams && Array.isArray(parsed.teams)) {
        return {
          teams: parsed.teams,
          activeTeamId: null, // Always land on team selection screen as requested!
          activeGame: parsed.activeGame ? reconcileLineupIntegrity(parsed.activeGame) : null,
          savedGames: parsed.savedGames || [],
        };
      }
    }
  } catch (err) {
    console.error('Failed to parse saved state from localStorage:', err);
  }

  // Initial defaults
  return {
    teams: SAMPLE_TEAMS,
    activeTeamId: null, // First screen you land on where you can create or choose a team!
    activeGame: null,
    savedGames: [],
  };
}

export function useSoccerStore() {
  const [state, setState] = useState<AppState>(loadInitialState);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [state]);

  const activeTeam = state.teams.find(t => t.id === state.activeTeamId) || null;

  // ---------------- Team Management ----------------
  const setActiveTeamId = useCallback((teamId: string | null) => {
    setState(prev => ({ ...prev, activeTeamId: teamId }));
  }, []);

  const restoreSampleData = useCallback(() => {
    setState({
      teams: SAMPLE_TEAMS,
      activeTeamId: null,
      activeGame: null,
      savedGames: [],
    });
  }, []);

  const addTeam = useCallback((
    name: string, 
    defaultPlayerCount: number, 
    primaryColor: string = '#2563eb', 
    secondaryColor: string = '#facc15',
    sport: SportType = 'soccer',
    timeTrackingMode: TimeTrackingMode = 'minutes',
    clockDirection: ClockDirection = 'countup',
    useStarters: boolean = false,
    warnMissingPlaymakers: boolean = true
  ) => {
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name,
      sport,
      timeTrackingMode,
      clockDirection,
      useStarters,
      warnMissingPlaymakers,
      defaultPlayerCount,
      primaryColor,
      secondaryColor,
      players: [],
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));
    return newTeam;
  }, []);

  const updateTeam = useCallback((updated: Team) => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === updated.id ? updated : t),
    }));
  }, []);

  const deleteTeam = useCallback((teamId: string) => {
    setState(prev => {
      const filtered = prev.teams.filter(t => t.id !== teamId);
      return {
        ...prev,
        teams: filtered,
        activeTeamId: prev.activeTeamId === teamId ? null : prev.activeTeamId,
        activeGame: prev.activeGame?.teamId === teamId ? null : prev.activeGame,
      };
    });
  }, []);

  const importTeam = useCallback((incomingTeam: Team, mode: 'overwrite' | 'new_copy' = 'overwrite') => {
    setState(prev => {
      const existingIdx = prev.teams.findIndex(t => t.id === incomingTeam.id);
      let targetTeam: Team;

      if (existingIdx !== -1 && mode === 'overwrite') {
        targetTeam = { ...incomingTeam };
        const updatedTeams = [...prev.teams];
        updatedTeams[existingIdx] = targetTeam;
        return {
          ...prev,
          teams: updatedTeams,
          activeTeamId: targetTeam.id,
        };
      } else {
        // Create as new team with fresh ID to avoid collisions
        const newTeamId = 'team-' + Date.now();
        targetTeam = {
          ...incomingTeam,
          id: newTeamId,
          name: mode === 'new_copy' ? `${incomingTeam.name} (Copy)` : incomingTeam.name,
          players: incomingTeam.players.map(p => ({
            ...p,
            id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            teamId: newTeamId,
          })),
        };
        return {
          ...prev,
          teams: [...prev.teams, targetTeam],
          activeTeamId: targetTeam.id,
        };
      }
    });
  }, []);

  const importBackupData = useCallback((incomingTeams: Team[], incomingSavedGames: Game[] = [], merge: boolean = true) => {
    setState(prev => {
      if (!merge) {
        return {
          teams: incomingTeams,
          activeTeamId: incomingTeams[0]?.id || null,
          activeGame: null,
          savedGames: incomingSavedGames,
        };
      }

      // Merge teams: update existing if matching ID or append if new
      const mergedTeams = [...prev.teams];
      for (const inc of incomingTeams) {
        const idx = mergedTeams.findIndex(t => t.id === inc.id);
        if (idx !== -1) {
          mergedTeams[idx] = inc;
        } else {
          mergedTeams.push(inc);
        }
      }

      // Merge saved games
      const mergedGames = [...prev.savedGames];
      for (const g of incomingSavedGames) {
        if (!mergedGames.some(existing => existing.id === g.id)) {
          mergedGames.push(g);
        }
      }

      return {
        ...prev,
        teams: mergedTeams,
        savedGames: mergedGames,
      };
    });
  }, []);

  // ---------------- Player Management (Skill is only set/viewed here!) ----------------
  const addPlayer = useCallback((teamId: string, player: Omit<Player, 'id' | 'teamId'>) => {
    const newPlayer: Player = {
      ...player,
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      teamId,
    };
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          players: [...t.players, newPlayer],
        };
      }),
    }));
    return newPlayer;
  }, []);

  const updatePlayer = useCallback((player: Player) => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id !== player.teamId) return t;
        return {
          ...t,
          players: t.players.map(p => p.id === player.id ? player : p),
        };
      }),
    }));
  }, []);

  const deletePlayer = useCallback((teamId: string, playerId: string) => {
    setState(prev => ({
      ...prev,
      teams: prev.teams.map(t => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          players: t.players.filter(p => p.id !== playerId),
        };
      }),
    }));
  }, []);

  // ---------------- Game Management ----------------
  const createNewGame = useCallback((
    teamId: string,
    opponentName: string,
    formatPlayerCount: number,
    formationId?: string,
    subMode: SubstitutionMode = 'free',
    cleanGoalieSwaps: boolean = true,
    periodsTotal: number = 2,
    periodDurationMinutes: number = 25
  ) => {
    const team = state.teams.find(t => t.id === teamId) || activeTeam || state.teams[0];
    if (!team) return null;

    const isBasketball = (team.sport === 'basketball') || formatPlayerCount === 5;
    const allFormations = isBasketball ? BASKETBALL_FORMATIONS : FORMATIONS;
    const defaultFormation = formationId 
      ? (allFormations.find(f => f.id === formationId) || (isBasketball ? getDefaultBasketballFormation(formatPlayerCount) : getDefaultFormation(formatPlayerCount)))
      : (isBasketball ? getDefaultBasketballFormation(formatPlayerCount) : getDefaultFormation(formatPlayerCount));

    // Initial state setup for players
    const initialPlayerStates: Record<string, PlayerMatchState> = {};
    team.players.forEach(p => {
      initialPlayerStates[p.id] = {
        playerId: p.id,
        status: 'on_bench',
        totalFieldSeconds: 0,
        totalBenchSeconds: 0,
        currentStintSeconds: 0,
        periodsPlayedCount: 0,
        periodsPlayed: [],
        isTired: false,
        goals: 0,
      };
    });

    // Auto-fill initial starters lineup respecting team.useStarters
    const populatedStates = autoFillLineup(team.players, defaultFormation, initialPlayerStates, Boolean(team.useStarters));

    const newGame: Game = {
      id: 'game-' + Date.now(),
      teamId: team.id,
      opponentName: opponentName.trim() || 'Opponent',
      date: new Date().toISOString(),
      sport: team.sport || (formatPlayerCount === 5 ? 'basketball' : 'soccer'),
      timeTrackingMode: team.timeTrackingMode || 'minutes',
      clockDirection: team.clockDirection || 'countup',
      warnMissingPlaymakers: team.warnMissingPlaymakers ?? true,
      formatPlayerCount,
      formationId: defaultFormation.id,
      subMode,
      cleanGoalieSwaps,
      periodsTotal,
      currentPeriod: 1,
      periodDurationMinutes,
      status: 'setup',
      elapsedPeriodSeconds: 0,
      totalElapsedSeconds: 0,
      playerStates: populatedStates,
      queuedSubs: [],
      events: [{
        id: 'evt-created-' + Date.now(),
        gameId: 'game-' + Date.now(),
        matchSecond: 0,
        period: 1,
        type: 'period_start',
        description: 'Match setup initialized',
        timestamp: Date.now(),
      }],
      scoreUs: 0,
      scoreThem: 0,
    };

    setState(prev => ({
      ...prev,
      activeGame: reconcileLineupIntegrity(newGame),
    }));

    return newGame;
  }, [state.teams, activeTeam]);

  // Set game status
  const setGameStatus = useCallback((status: MatchStatus) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          status,
        },
      };
    });
  }, []);

  // Formation Change
  const changeFormation = useCallback((newFormationId: string) => {
    setState(prev => {
      const game = prev.activeGame;
      if (!game) return prev;
      const team = prev.teams.find(t => t.id === game.teamId);
      if (!team) return prev;
      const allFormations = [...FORMATIONS, ...BASKETBALL_FORMATIONS];
      const formation = allFormations.find(f => f.id === newFormationId);
      if (!formation) return prev;

      // Re-run auto fill with new formation while preserving stats
      const updatedStates = autoFillLineup(team.players, formation, game.playerStates, Boolean(team.useStarters));

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity({
          ...game,
          formationId: newFormationId,
          playerStates: updatedStates,
          queuedSubs: [], // Clear any invalid queued subs on formation change
        }),
      };
    });
  }, []);

  // Re-run Auto-fill starters
  const autoFillStartersAction = useCallback(() => {
    setState(prev => {
      const game = prev.activeGame;
      if (!game) return prev;
      const team = prev.teams.find(t => t.id === game.teamId);
      if (!team) return prev;
      const allFormations = [...FORMATIONS, ...BASKETBALL_FORMATIONS];
      const formation = allFormations.find(f => f.id === game.formationId) || 
        (team.sport === 'basketball' ? getDefaultBasketballFormation(game.formatPlayerCount) : getDefaultFormation(game.formatPlayerCount));

      const updatedStates = autoFillLineup(team.players, formation, game.playerStates, Boolean(team.useStarters));

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity({
          ...game,
          playerStates: updatedStates,
          queuedSubs: [],
        }),
      };
    });
  }, []);

  // Timer Tick
  const tickTimer = useCallback((deltaSeconds: number) => {
    setState(prev => {
      if (!prev.activeGame || prev.activeGame.status !== 'running') return prev;

      const g = prev.activeGame;
      const newElapsedPeriod = g.elapsedPeriodSeconds + deltaSeconds;
      const newTotalElapsed = g.totalElapsedSeconds + deltaSeconds;

      const updatedPlayerStates = { ...g.playerStates };
      Object.keys(updatedPlayerStates).forEach(pId => {
        const pState = updatedPlayerStates[pId];
        if (pState.status === 'on_field') {
          // Record participation in this period while the clock was actually running
          const currentPeriods = pState.periodsPlayed ? [...pState.periodsPlayed] : [];
          if (!currentPeriods.includes(g.currentPeriod)) {
            currentPeriods.push(g.currentPeriod);
          }

          updatedPlayerStates[pId] = {
            ...pState,
            totalFieldSeconds: pState.totalFieldSeconds + deltaSeconds,
            currentStintSeconds: pState.currentStintSeconds + deltaSeconds,
            periodsPlayed: currentPeriods,
            periodsPlayedCount: currentPeriods.length,
          };
        } else if (pState.status === 'on_bench') {
          updatedPlayerStates[pId] = {
            ...pState,
            totalBenchSeconds: pState.totalBenchSeconds + deltaSeconds,
            currentStintSeconds: pState.currentStintSeconds + deltaSeconds,
          };
        }
      });

      return {
        ...prev,
        activeGame: {
          ...g,
          elapsedPeriodSeconds: newElapsedPeriod,
          totalElapsedSeconds: newTotalElapsed,
          playerStates: updatedPlayerStates,
        },
      };
    });
  }, []);

  // Manual Clock Adjustment (e.g. sync with referee's watch +/- 60s)
  const adjustGameClock = useCallback((deltaSeconds: number) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const newElapsedPeriod = Math.max(0, g.elapsedPeriodSeconds + deltaSeconds);
      const newTotalElapsed = Math.max(0, g.totalElapsedSeconds + deltaSeconds);

      const updatedPlayerStates = { ...g.playerStates };
      Object.keys(updatedPlayerStates).forEach(pId => {
        const pState = updatedPlayerStates[pId];
        if (pState.status === 'on_field') {
          updatedPlayerStates[pId] = {
            ...pState,
            totalFieldSeconds: Math.max(0, pState.totalFieldSeconds + deltaSeconds),
            currentStintSeconds: Math.max(0, pState.currentStintSeconds + deltaSeconds),
          };
        } else if (pState.status === 'on_bench') {
          updatedPlayerStates[pId] = {
            ...pState,
            totalBenchSeconds: Math.max(0, pState.totalBenchSeconds + deltaSeconds),
            currentStintSeconds: Math.max(0, pState.currentStintSeconds + deltaSeconds),
          };
        }
      });

      return {
        ...prev,
        activeGame: {
          ...g,
          elapsedPeriodSeconds: newElapsedPeriod,
          totalElapsedSeconds: newTotalElapsed,
          playerStates: updatedPlayerStates,
        },
      };
    });
  }, []);

  // Tactical Overrides (FORCE or FAVOR)
  const setTacticalOverride = useCallback((playerId: string, override: TacticalOverride | undefined) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const current = prev.activeGame.playerStates[playerId];
      if (!current) return prev;

      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          playerStates: {
            ...prev.activeGame.playerStates,
            [playerId]: {
              ...current,
              tacticalOverride: override,
            },
          },
        },
      };
    });
  }, []);

  // Toggle Tired Player
  const togglePlayerTired = useCallback((playerId: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const current = prev.activeGame.playerStates[playerId];
      if (!current) return prev;

      const newTired = !current.isTired;
      const event: MatchEvent | null = newTired ? {
        id: 'evt-tired-' + Date.now(),
        gameId: prev.activeGame.id,
        matchSecond: Math.floor(prev.activeGame.totalElapsedSeconds),
        period: prev.activeGame.currentPeriod,
        type: 'tired',
        playerId,
        description: `Player marked tired`,
        timestamp: Date.now(),
      } : null;

      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          playerStates: {
            ...prev.activeGame.playerStates,
            [playerId]: {
              ...current,
              isTired: newTired,
            },
          },
          events: event ? [...prev.activeGame.events, event] : prev.activeGame.events,
        },
      };
    });
  }, []);

  // Toggle Player Availability (CNP / Absent / Active)
  const togglePlayerAvailability = useCallback((playerId: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const current = prev.activeGame.playerStates[playerId];
      if (!current) return prev;

      const team = prev.teams.find(t => t.id === prev.activeGame?.teamId);
      const player = team?.players.find(p => p.id === playerId);
      const playerName = player?.name || `#${player?.number ?? ''}`;

      let nextStatus: 'on_field' | 'on_bench' | 'absent';
      let description = '';

      if (current.status === 'absent') {
        // Player arrives or recovers: activate them to bench
        nextStatus = 'on_bench';
        description = `${playerName} activated (available on bench)`;
      } else {
        // Player is sick/injured/absent: mark CNP
        nextStatus = 'absent';
        description = `${playerName} marked Cannot Play (CNP)`;
      }

      // Remove any queued subs involving this player
      const updatedQueuedSubs = prev.activeGame.queuedSubs.filter(
        q => q.playerInId !== playerId && q.playerOutId !== playerId
      );

      const event: MatchEvent = {
        id: 'evt-avail-' + Date.now(),
        gameId: prev.activeGame.id,
        matchSecond: Math.floor(prev.activeGame.totalElapsedSeconds),
        period: prev.activeGame.currentPeriod,
        type: 'sub',
        playerId,
        description,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity({
          ...prev.activeGame,
          playerStates: {
            ...prev.activeGame.playerStates,
            [playerId]: {
              ...current,
              status: nextStatus,
              assignedSlotId: nextStatus === 'absent' ? undefined : current.assignedSlotId,
              assignedRole: nextStatus === 'absent' ? undefined : current.assignedRole,
              currentStintSeconds: 0,
              isTired: false,
            },
          },
          queuedSubs: updatedQueuedSubs,
          events: [...prev.activeGame.events, event],
        }),
      };
    });
  }, []);

  // Register Goal
  const registerGoal = useCallback((playerId?: string, isUs: boolean = true) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const team = prev.teams.find(t => t.id === g.teamId);
      const player = playerId ? team?.players.find(p => p.id === playerId) : null;
      const current = playerId ? g.playerStates[playerId] : null;

      const event: MatchEvent = {
        id: 'evt-goal-' + Date.now(),
        gameId: g.id,
        matchSecond: Math.floor(g.totalElapsedSeconds),
        period: g.currentPeriod,
        type: 'goal',
        playerId: isUs ? playerId : undefined,
        description: isUs 
          ? (player ? `GOAL! Scored by ${player.name} (#${player.number})!` : `GOAL! Scored for ${team?.name || 'our team'}!`)
          : `Opponent scored a point (${g.opponentName}).`,
        timestamp: Date.now(),
      };

      const updatedStates = { ...g.playerStates };
      if (isUs && playerId && current) {
        updatedStates[playerId] = {
          ...current,
          goals: (current.goals || 0) + 1,
        };
      }

      return {
        ...prev,
        activeGame: {
          ...g,
          scoreUs: isUs ? g.scoreUs + 1 : g.scoreUs,
          scoreThem: !isUs ? g.scoreThem + 1 : g.scoreThem,
          playerStates: updatedStates,
          events: [...g.events, event],
        },
      };
    });
  }, []);

  // Opponent Goal (without specific player)
  const registerOpponentGoal = useCallback(() => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          scoreThem: prev.activeGame.scoreThem + 1,
          events: [
            ...prev.activeGame.events,
            {
              id: 'evt-opp-goal-' + Date.now(),
              gameId: prev.activeGame.id,
              matchSecond: Math.floor(prev.activeGame.totalElapsedSeconds),
              period: prev.activeGame.currentPeriod,
              type: 'goal',
              description: `Opponent scored a point (${prev.activeGame.opponentName}).`,
              timestamp: Date.now(),
            }
          ]
        },
      };
    });
  }, []);

  // Adjust Score (+1 or -1 for either team, automatically deducting player stats on decrement)
  const adjustScore = useCallback((side: 'us' | 'them', delta: number) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const currentScore = side === 'us' ? g.scoreUs : g.scoreThem;
      const newScore = Math.max(0, currentScore + delta);
      if (newScore === currentScore) return prev;

      const updatedStates = { ...g.playerStates };
      let updatedEvents = [...g.events];

      if (side === 'us') {
        if (delta < 0) {
          // Find the most recent goal event for our team to deduct that player's goals count
          let scorerIdToDeduct: string | null = null;
          let eventIndexToRemove = -1;

          for (let i = updatedEvents.length - 1; i >= 0; i--) {
            const ev = updatedEvents[i];
            if (ev.type === 'goal' && (ev.playerId || ev.description.includes('GOAL!'))) {
              scorerIdToDeduct = ev.playerId || null;
              eventIndexToRemove = i;
              break;
            }
          }

          if (scorerIdToDeduct && updatedStates[scorerIdToDeduct]) {
            const pState = updatedStates[scorerIdToDeduct];
            updatedStates[scorerIdToDeduct] = {
              ...pState,
              goals: Math.max(0, (pState.goals || 0) - 1),
            };
          }

          if (eventIndexToRemove >= 0) {
            updatedEvents.splice(eventIndexToRemove, 1);
          }
        }
      } else {
        // Opponent side
        if (delta < 0) {
          let eventIndexToRemove = -1;
          for (let i = updatedEvents.length - 1; i >= 0; i--) {
            const ev = updatedEvents[i];
            if (ev.type === 'goal' && (!ev.playerId || ev.description.includes('Opponent'))) {
              eventIndexToRemove = i;
              break;
            }
          }
          if (eventIndexToRemove >= 0) {
            updatedEvents.splice(eventIndexToRemove, 1);
          }
        }
      }

      return {
        ...prev,
        activeGame: {
          ...g,
          scoreUs: side === 'us' ? newScore : g.scoreUs,
          scoreThem: side === 'them' ? newScore : g.scoreThem,
          playerStates: updatedStates,
          events: updatedEvents,
        },
      };
    });
  }, []);

  // Queue a Single Substitution
  const queueSub = useCallback((playerOutId: string, playerInId: string, targetSlotId?: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;

      const outState = prev.activeGame.playerStates[playerOutId];
      const slotId = targetSlotId || outState?.assignedSlotId;
      if (!slotId) return prev;

      // Remove existing queued subs involving either player
      const filtered = prev.activeGame.queuedSubs.filter(
        q => q.playerOutId !== playerOutId && q.playerInId !== playerInId && q.playerOutId !== playerInId && q.playerInId !== playerOutId
      );

      const newSub: QueuedSub = {
        id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        playerOutId,
        playerInId,
        targetSlotId: slotId,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          queuedSubs: [...filtered, newSub],
        },
      };
    });
  }, []);

  // Queue Multiple Substitutions (e.g. from Full Bench Swap)
  const queueMultipleSubs = useCallback((subs: { playerOutId: string; playerInId: string; targetSlotId: string }[]) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const newSubs: QueuedSub[] = subs.map(s => ({
        id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        playerOutId: s.playerOutId,
        playerInId: s.playerInId,
        targetSlotId: s.targetSlotId,
        timestamp: Date.now(),
      }));

      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          queuedSubs: newSubs,
        },
      };
    });
  }, []);

  // Cancel a queued sub
  const cancelQueuedSub = useCallback((subId: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          queuedSubs: prev.activeGame.queuedSubs.filter(s => s.id !== subId),
        },
      };
    });
  }, []);

  // Clear all queued subs
  const clearQueuedSubs = useCallback(() => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          queuedSubs: [],
        },
      };
    });
  }, []);

  // Confirm and Execute All Queued Substitutions
  const confirmQueuedSubs = useCallback(() => {
    setState(prev => {
      if (!prev.activeGame || prev.activeGame.queuedSubs.length === 0) return prev;

      const g = prev.activeGame;
      const team = prev.teams.find(t => t.id === g.teamId);
      const formation = FORMATIONS.find(f => f.id === g.formationId);
      const updatedStates = { ...g.playerStates };
      const newEvents: MatchEvent[] = [...g.events];

      g.queuedSubs.forEach(q => {
        const outPlayer = team?.players.find(p => p.id === q.playerOutId);
        const inPlayer = team?.players.find(p => p.id === q.playerInId);

        // Dynamically resolve target slot from playerOut's current assignedSlotId if available
        const currentOutSlotId = updatedStates[q.playerOutId]?.assignedSlotId;
        const targetSlotId = currentOutSlotId || q.targetSlotId;
        const slot = formation?.slots.find(s => s.id === targetSlotId);

        // Sub OUT: moves to bench, resets stint, clears tired
        if (updatedStates[q.playerOutId]) {
          updatedStates[q.playerOutId] = {
            ...updatedStates[q.playerOutId],
            status: 'on_bench',
            assignedSlotId: undefined,
            assignedRole: undefined,
            currentStintSeconds: 0,
            isTired: false,
          };
        }

        // Sub IN: moves to field, assigned slot, resets stint
        if (updatedStates[q.playerInId]) {
          updatedStates[q.playerInId] = {
            ...updatedStates[q.playerInId],
            status: 'on_field',
            assignedSlotId: targetSlotId,
            assignedRole: slot?.role || 'SUB',
            currentStintSeconds: 0,
            isTired: false,
          };
        }

        // Add Match Event
        newEvents.push({
          id: 'evt-sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          gameId: g.id,
          matchSecond: Math.floor(g.totalElapsedSeconds),
          period: g.currentPeriod,
          type: 'sub',
          playerInId: q.playerInId,
          playerOutId: q.playerOutId,
          description: `SUB: ${inPlayer?.name || '#' + inPlayer?.number} ON for ${outPlayer?.name || '#' + outPlayer?.number} (${slot?.role || 'Position'})`,
          timestamp: Date.now(),
        });
      });

      const updatedGame: Game = {
        ...g,
        playerStates: updatedStates,
        queuedSubs: [],
        events: newEvents,
      };

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity(updatedGame),
      };
    });
  }, []);

  // Direct Swap (Instant single swap without staging in queue)
  const directSwap = useCallback((playerOutId: string, playerInId: string, targetSlotId?: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const team = prev.teams.find(t => t.id === g.teamId);
      const formation = FORMATIONS.find(f => f.id === g.formationId);
      const slotId = targetSlotId || g.playerStates[playerOutId]?.assignedSlotId;
      const slot = formation?.slots.find(s => s.id === slotId);

      const outPlayer = team?.players.find(p => p.id === playerOutId);
      const inPlayer = team?.players.find(p => p.id === playerInId);

      const updatedStates = { ...g.playerStates };

      // Sub out
      if (updatedStates[playerOutId]) {
        updatedStates[playerOutId] = {
          ...updatedStates[playerOutId],
          status: 'on_bench',
          assignedSlotId: undefined,
          assignedRole: undefined,
          currentStintSeconds: 0,
          isTired: false,
        };
      }

      // Sub in
      if (updatedStates[playerInId]) {
        updatedStates[playerInId] = {
          ...updatedStates[playerInId],
          status: 'on_field',
          assignedSlotId: slotId,
          assignedRole: slot?.role || 'SUB',
          currentStintSeconds: 0,
          isTired: false,
        };
      }

      const event: MatchEvent = {
        id: 'evt-sub-' + Date.now(),
        gameId: g.id,
        matchSecond: Math.floor(g.totalElapsedSeconds),
        period: g.currentPeriod,
        type: 'sub',
        playerInId,
        playerOutId,
        description: `Direct Sub: ${inPlayer?.name || '#' + inPlayer?.number} ON for ${outPlayer?.name || '#' + outPlayer?.number}`,
        timestamp: Date.now(),
      };

      const updatedGame: Game = {
        ...g,
        playerStates: updatedStates,
        events: [...g.events, event],
      };

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity(updatedGame),
      };
    });
  }, []);

  // Swap Two Field Players' Positions
  const swapFieldPositions = useCallback((player1Id: string, player2Id: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const p1State = g.playerStates[player1Id];
      const p2State = g.playerStates[player2Id];
      if (!p1State || !p2State) return prev;

      const team = prev.teams.find(t => t.id === g.teamId);
      const p1 = team?.players.find(p => p.id === player1Id);
      const p2 = team?.players.find(p => p.id === player2Id);

      const event: MatchEvent = {
        id: 'evt-swap-' + Date.now(),
        gameId: g.id,
        matchSecond: Math.floor(g.totalElapsedSeconds),
        period: g.currentPeriod,
        type: 'sub',
        description: `Position Swap: #${p1?.number ?? ''} (${p2State.assignedRole}) ↔ #${p2?.number ?? ''} (${p1State.assignedRole})`,
        timestamp: Date.now(),
      };

      // Sync any queued substitutions targeting either swapped player to their new slot
      const updatedQueuedSubs = g.queuedSubs.map(q => {
        if (q.playerOutId === player1Id && p2State.assignedSlotId) {
          return { ...q, targetSlotId: p2State.assignedSlotId };
        }
        if (q.playerOutId === player2Id && p1State.assignedSlotId) {
          return { ...q, targetSlotId: p1State.assignedSlotId };
        }
        return q;
      });

      const updatedGame: Game = {
        ...g,
        playerStates: {
          ...g.playerStates,
          [player1Id]: {
            ...p1State,
            assignedSlotId: p2State.assignedSlotId,
            assignedRole: p2State.assignedRole,
          },
          [player2Id]: {
            ...p2State,
            assignedSlotId: p1State.assignedSlotId,
            assignedRole: p1State.assignedRole,
          },
        },
        queuedSubs: updatedQueuedSubs,
        events: [...g.events, event],
      };

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity(updatedGame),
      };
    });
  }, []);

  // Assign a bench player to an unassigned pitch slot
  const assignBenchPlayerToSlot = useCallback((playerId: string, slotId: string, role: string) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const current = g.playerStates[playerId];
      if (!current) return prev;

      const team = prev.teams.find(t => t.id === g.teamId);
      const player = team?.players.find(p => p.id === playerId);

      const event: MatchEvent = {
        id: 'evt-assign-' + Date.now(),
        gameId: g.id,
        matchSecond: Math.floor(g.totalElapsedSeconds),
        period: g.currentPeriod,
        type: 'sub',
        description: `Field Assignment: #${player?.number ?? ''} ${player?.name ?? ''} slotted at ${role}`,
        timestamp: Date.now(),
      };

      const updatedGame: Game = {
        ...g,
        playerStates: {
          ...g.playerStates,
          [playerId]: {
            ...current,
            status: 'on_field',
            assignedSlotId: slotId,
            assignedRole: role,
            currentStintSeconds: 0,
          },
        },
        events: [...g.events, event],
      };

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity(updatedGame),
      };
    });
  }, []);

  // Advance Period (e.g. Q1 -> Q2, Halftime)
  const advancePeriod = useCallback(() => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      const nextPeriod = g.currentPeriod + 1;
      const isFinished = nextPeriod > g.periodsTotal;

      // Synchronize period credit for players who played while clock ran or if ending during an active period
      const updatedPlayerStates = { ...g.playerStates };
      Object.keys(updatedPlayerStates).forEach(pid => {
        const ps = updatedPlayerStates[pid];
        const periods = ps.periodsPlayed ? [...ps.periodsPlayed] : [];
        // If clock ran during this period (>0s elapsed in this period) and player was on court/field, ensure credited
        if (ps.status === 'on_field' && g.elapsedPeriodSeconds > 0 && !periods.includes(g.currentPeriod)) {
          periods.push(g.currentPeriod);
        }
        updatedPlayerStates[pid] = {
          ...ps,
          periodsPlayed: periods,
          periodsPlayedCount: periods.length,
        };
      });

      const event: MatchEvent = {
        id: 'evt-period-' + Date.now(),
        gameId: g.id,
        matchSecond: Math.floor(g.totalElapsedSeconds),
        period: g.currentPeriod,
        type: isFinished ? 'period_end' : 'period_start',
        description: isFinished ? 'Match Ended' : `Period ${nextPeriod} Started`,
        timestamp: Date.now(),
      };

      const updatedGame: Game = {
        ...g,
        playerStates: updatedPlayerStates,
        currentPeriod: isFinished ? g.currentPeriod : nextPeriod,
        elapsedPeriodSeconds: 0,
        status: isFinished ? 'finished' : 'period_break',
        events: [...g.events, event],
      };

      return {
        ...prev,
        activeGame: reconcileLineupIntegrity(updatedGame),
      };
    });
  }, []);

  // End & Save Game (returns the finished game object for post-match recap)
  const endGame = useCallback((): Game | null => {
    let finishedGame: Game | null = null;
    setState(prev => {
      if (!prev.activeGame) return prev;
      const g = prev.activeGame;
      
      // Ensure any player on court/field while clock was running in the active period has it recorded
      const finalStates = { ...g.playerStates };
      Object.keys(finalStates).forEach(pid => {
        const ps = finalStates[pid];
        const periods = ps.periodsPlayed ? [...ps.periodsPlayed] : [];
        if (ps.status === 'on_field' && g.elapsedPeriodSeconds > 0 && !periods.includes(g.currentPeriod)) {
          periods.push(g.currentPeriod);
        }
        finalStates[pid] = {
          ...ps,
          periodsPlayed: periods,
          periodsPlayedCount: periods.length,
        };
      });

      finishedGame = {
        ...g,
        playerStates: finalStates,
        status: 'finished',
      };
      return {
        ...prev,
        activeGame: null,
        savedGames: [finishedGame, ...prev.savedGames],
      };
    });
    return finishedGame;
  }, []);

  // Delete a saved match from history
  const deleteSavedGame = useCallback((gameId: string) => {
    setState(prev => ({
      ...prev,
      savedGames: prev.savedGames.filter(g => g.id !== gameId),
    }));
  }, []);

  // Toggle Clean Goalie Swaps setting in active game
  const toggleCleanGoalieSwaps = useCallback(() => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          cleanGoalieSwaps: !prev.activeGame.cleanGoalieSwaps,
        },
      };
    });
  }, []);

  return {
    teams: state.teams,
    activeTeam,
    activeTeamId: state.activeTeamId,
    activeGame: state.activeGame,
    savedGames: state.savedGames,
    setActiveTeamId,
    restoreSampleData,
    addTeam,
    updateTeam,
    deleteTeam,
    importTeam,
    importBackupData,
    addPlayer,
    updatePlayer,
    deletePlayer,
    createNewGame,
    setGameStatus,
    changeFormation,
    autoFillStartersAction,
    tickTimer,
    adjustGameClock,
    setTacticalOverride,
    togglePlayerTired,
    togglePlayerAvailability,
    registerGoal,
    registerOpponentGoal,
    adjustScore,
    deleteSavedGame,
    queueSub,
    queueMultipleSubs,
    cancelQueuedSub,
    clearQueuedSubs,
    confirmQueuedSubs,
    directSwap,
    swapFieldPositions,
    assignBenchPlayerToSlot,
    advancePeriod,
    endGame,
    toggleCleanGoalieSwaps,
  };
}
