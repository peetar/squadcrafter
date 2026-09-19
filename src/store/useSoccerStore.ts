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
import { SAMPLE_TEAMS } from '../data/sampleData';
import { FORMATIONS, getDefaultFormation } from '../data/formations';
import { autoFillLineup } from '../services/lineupOptimizer';

const STORAGE_KEY = 'squadcrafter_app_state_v1';

export interface AppState {
  teams: Team[];
  activeTeamId: string | null;
  activeGame: Game | null;
  savedGames: Game[];
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
          activeGame: parsed.activeGame || null,
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

  const addTeam = useCallback((name: string, defaultPlayerCount: number, primaryColor: string = '#2563eb', secondaryColor: string = '#facc15') => {
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name,
      defaultPlayerCount,
      primaryColor,
      secondaryColor,
      players: [],
      createdAt: Date.now(),
    };
    setState(prev => ({
      ...prev,
      teams: [...prev.teams, newTeam],
      activeTeamId: newTeam.id,
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

    const defaultFormation = formationId 
      ? (FORMATIONS.find(f => f.id === formationId) || getDefaultFormation(formatPlayerCount))
      : getDefaultFormation(formatPlayerCount);

    // Initial state setup for players
    const initialPlayerStates: Record<string, PlayerMatchState> = {};
    team.players.forEach(p => {
      initialPlayerStates[p.id] = {
        playerId: p.id,
        status: 'on_bench',
        totalFieldSeconds: 0,
        totalBenchSeconds: 0,
        currentStintSeconds: 0,
        isTired: false,
        goals: 0,
      };
    });

    // Auto-fill initial starters lineup
    const populatedStates = autoFillLineup(team.players, defaultFormation, initialPlayerStates);

    const newGame: Game = {
      id: 'game-' + Date.now(),
      teamId: team.id,
      opponentName: opponentName.trim() || 'Opponent',
      date: new Date().toISOString(),
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
      activeGame: newGame,
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
      const formation = FORMATIONS.find(f => f.id === newFormationId);
      if (!formation) return prev;

      // Re-run auto fill with new formation while preserving stats
      const updatedStates = autoFillLineup(team.players, formation, game.playerStates);

      return {
        ...prev,
        activeGame: {
          ...game,
          formationId: newFormationId,
          playerStates: updatedStates,
          queuedSubs: [], // Clear any invalid queued subs on formation change
        },
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
      const formation = FORMATIONS.find(f => f.id === game.formationId) || getDefaultFormation(game.formatPlayerCount);

      const updatedStates = autoFillLineup(team.players, formation, game.playerStates);

      return {
        ...prev,
        activeGame: {
          ...game,
          playerStates: updatedStates,
          queuedSubs: [],
        },
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
          updatedPlayerStates[pId] = {
            ...pState,
            totalFieldSeconds: pState.totalFieldSeconds + deltaSeconds,
            currentStintSeconds: pState.currentStintSeconds + deltaSeconds,
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
        activeGame: {
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
        },
      };
    });
  }, []);

  // Register Goal
  const registerGoal = useCallback((playerId: string, isUs: boolean = true) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const current = prev.activeGame.playerStates[playerId];
      const newGoals = (current?.goals || 0) + (isUs ? 1 : 0);

      const team = prev.teams.find(t => t.id === prev.activeGame?.teamId);
      const player = team?.players.find(p => p.id === playerId);

      const event: MatchEvent = {
        id: 'evt-goal-' + Date.now(),
        gameId: prev.activeGame.id,
        matchSecond: Math.floor(prev.activeGame.totalElapsedSeconds),
        period: prev.activeGame.currentPeriod,
        type: 'goal',
        playerId,
        description: isUs 
          ? `GOAL! Scored by ${player?.name || 'Player #' + player?.number}!`
          : `Opponent scored a goal.`,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          scoreUs: isUs ? prev.activeGame.scoreUs + 1 : prev.activeGame.scoreUs,
          scoreThem: !isUs ? prev.activeGame.scoreThem + 1 : prev.activeGame.scoreThem,
          playerStates: current ? {
            ...prev.activeGame.playerStates,
            [playerId]: {
              ...current,
              goals: newGoals,
            },
          } : prev.activeGame.playerStates,
          events: [...prev.activeGame.events, event],
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
              description: `Opponent scored a goal (${prev.activeGame.opponentName}).`,
              timestamp: Date.now(),
            }
          ]
        },
      };
    });
  }, []);

  // Adjust Score (+1 or -1 for either team)
  const adjustScore = useCallback((side: 'us' | 'them', delta: number) => {
    setState(prev => {
      if (!prev.activeGame) return prev;
      const currentScore = side === 'us' ? prev.activeGame.scoreUs : prev.activeGame.scoreThem;
      const newScore = Math.max(0, currentScore + delta);
      if (newScore === currentScore) return prev;

      const eventDescription = delta > 0
        ? (side === 'us' ? 'Goal recorded for team.' : `Opponent scored a goal (${prev.activeGame.opponentName}).`)
        : (side === 'us' ? 'Team goal corrected (-1).' : `Opponent goal corrected (-1).`);

      const event: MatchEvent = {
        id: 'evt-score-adj-' + Date.now(),
        gameId: prev.activeGame.id,
        matchSecond: Math.floor(prev.activeGame.totalElapsedSeconds),
        period: prev.activeGame.currentPeriod,
        type: 'goal',
        description: eventDescription,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activeGame: {
          ...prev.activeGame,
          scoreUs: side === 'us' ? newScore : prev.activeGame.scoreUs,
          scoreThem: side === 'them' ? newScore : prev.activeGame.scoreThem,
          events: [...prev.activeGame.events, event],
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
        const slot = formation?.slots.find(s => s.id === q.targetSlotId);

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
            assignedSlotId: q.targetSlotId,
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

      return {
        ...prev,
        activeGame: {
          ...g,
          playerStates: updatedStates,
          queuedSubs: [],
          events: newEvents,
        },
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

      return {
        ...prev,
        activeGame: {
          ...g,
          playerStates: updatedStates,
          events: [...g.events, event],
        },
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

      return {
        ...prev,
        activeGame: {
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
          events: [...g.events, event],
        },
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

      return {
        ...prev,
        activeGame: {
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
        },
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

      const event: MatchEvent = {
        id: 'evt-period-' + Date.now(),
        gameId: g.id,
        matchSecond: Math.floor(g.totalElapsedSeconds),
        period: g.currentPeriod,
        type: isFinished ? 'period_end' : 'period_start',
        description: isFinished ? 'Match Ended' : `Period ${nextPeriod} Started`,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        activeGame: {
          ...g,
          currentPeriod: isFinished ? g.currentPeriod : nextPeriod,
          elapsedPeriodSeconds: 0,
          status: isFinished ? 'finished' : 'period_break',
          events: [...g.events, event],
        },
      };
    });
  }, []);

  // End & Save Game (returns the finished game object for post-match recap)
  const endGame = useCallback((): Game | null => {
    let finishedGame: Game | null = null;
    setState(prev => {
      if (!prev.activeGame) return prev;
      finishedGame = {
        ...prev.activeGame,
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
