import React, { useState } from 'react';
import { Game, Player, Team } from '../../types/soccer';
import { formatTime } from '../../utils/celebration';
import { MatchHistoryList } from './MatchHistoryList';
import { BarChart3, Clock, Award, History, Plus, Minus, CheckCircle2 } from 'lucide-react';

interface GameStatsSummaryProps {
  game: Game | null;
  team: Team;
  players: Player[];
  savedGames: Game[];
  onAdvancePeriod?: () => void;
  onEndGame?: () => void;
  onSelectPastGame: (game: Game) => void;
  onDeleteSavedGame: (gameId: string) => void;
  onRegisterOpponentGoal?: () => void;
  onAdjustScore?: (side: 'us' | 'them', delta: number) => void;
  onAdjustClock?: (deltaSeconds: number) => void;
}

export const GameStatsSummary: React.FC<GameStatsSummaryProps> = ({
  game,
  team,
  players,
  savedGames,
  onAdvancePeriod,
  onEndGame,
  onSelectPastGame,
  onDeleteSavedGame,
  onRegisterOpponentGoal,
  onAdjustScore,
  onAdjustClock,
}) => {
  const teamSavedGames = savedGames.filter(g => g.teamId === team.id || !g.teamId);
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'history'>(game ? 'live' : 'history');

  // If no game is active, always show history
  const showLive = game && activeSubTab === 'live';

  const totalMatchSeconds = Math.max(game?.totalElapsedSeconds || 0, 1);

  // Goal scorers for active game
  const goalScorers = game
    ? players
        .map(p => ({ player: p, goals: game.playerStates[p.id]?.goals || 0 }))
        .filter(item => item.goals > 0)
        .sort((a, b) => b.goals - a.goals)
    : [];

  const isPeriodTracking = game?.timeTrackingMode === 'periods';
  const effectivePeriodsTotal = Math.max(1, game?.currentPeriod || 1);

  // Sorted by playing time percentage
  const playingTimeData = game
    ? players.map(p => {
        const s = game.playerStates[p.id];
        const fieldSec = s?.totalFieldSeconds || 0;
        const benchSec = s?.totalBenchSeconds || 0;
        const periodsPlayed = s?.periodsPlayed ? s.periodsPlayed.length : (s?.periodsPlayedCount || 0);

        const pct = isPeriodTracking
          ? Math.round((periodsPlayed / effectivePeriodsTotal) * 100)
          : Math.round((fieldSec / totalMatchSeconds) * 100);

        const isAbsent = s?.status === 'absent';

        return {
          player: p,
          fieldSeconds: fieldSec,
          benchSeconds: benchSec,
          fieldMinutes: Math.round(fieldSec / 60),
          benchMinutes: Math.round(benchSec / 60),
          periodsPlayed,
          percent: Math.min(pct, 100),
          isGoalie: p.canPlayGK,
          goals: s?.goals || 0,
          status: s?.status || 'on_bench',
          isAbsent,
        };
      }).sort((a, b) => isPeriodTracking ? b.periodsPlayed - a.periodsPlayed : b.fieldSeconds - a.fieldSeconds)
    : [];

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full px-3 py-2 pb-32 space-y-4">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col gap-2 py-2 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Stats & Match History</span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400">
                {showLive ? `Match: ${formatTime(game.totalElapsedSeconds)} (P${game.currentPeriod}: ${formatTime(game.elapsedPeriodSeconds)})` : `${teamSavedGames.length} past matches on record`}
              </p>
              {showLive && onAdjustClock && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onAdjustClock(-60)}
                    className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-bold active:scale-90 transition"
                    title="Subtract 1 minute from match clock"
                  >
                    -1m
                  </button>
                  <button
                    onClick={() => onAdjustClock(60)}
                    className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-bold active:scale-90 transition"
                    title="Add 1 minute to match clock"
                  >
                    +1m
                  </button>
                </div>
              )}
            </div>
          </div>

          {showLive && onEndGame && (
            <div className="flex items-center gap-1.5">
              {onAdvancePeriod && game.currentPeriod < game.periodsTotal && (
                <button
                  onClick={onAdvancePeriod}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow transition"
                >
                  {game.periodsTotal === 4 ? `Q${game.currentPeriod + 1}` : '2nd Half'}
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm('End match now and view post-game recap?')) {
                    onEndGame();
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition"
              >
                End Match
              </button>
            </div>
          )}
        </div>

        {/* Segmented Control Tabs (if game is active) */}
        {game && (
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setActiveSubTab('live')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'live'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Live Match Stats</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-slate-800 text-white shadow border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Match History ({teamSavedGames.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub-Tab 1: Live Game Stats */}
      {showLive && game && (
        <div className="space-y-4">
          {/* Interactive Scoreboard Card with Goal Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {team.name} vs {game.opponentName}
                </div>
                <div className="flex items-center gap-3 font-mono text-3xl font-black text-white mt-1">
                  <span className="text-emerald-400">{game.scoreUs}</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-slate-200">{game.scoreThem}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-300">
                  Period {game.currentPeriod} of {game.periodsTotal}
                </div>
                <div className="text-[11px] text-slate-500 capitalize">
                  Status: {game.status}
                </div>
              </div>
            </div>

            {/* Score Adjustment Buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              {/* Us Goal Controls */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 text-[11px]">Our Team:</span>
                {onAdjustScore && (
                  <button
                    onClick={() => onAdjustScore('us', 1)}
                    className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-lg font-extrabold text-xs active:scale-95 transition"
                    title="Add Goal for our team"
                  >
                    + Goal
                  </button>
                )}
                {onAdjustScore && game.scoreUs > 0 && (
                  <button
                    onClick={() => onAdjustScore('us', -1)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs active:scale-95 transition"
                    title="Correct score (-1)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Opponent Goal Controls */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 text-[11px]">Opponent:</span>
                {onRegisterOpponentGoal && (
                  <button
                    onClick={onRegisterOpponentGoal}
                    className="px-2 py-0.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg font-extrabold text-xs active:scale-95 transition"
                    title={`Add goal for ${game.opponentName}`}
                  >
                    + Goal
                  </button>
                )}
                {onAdjustScore && game.scoreThem > 0 && (
                  <button
                    onClick={() => onAdjustScore('them', -1)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs active:scale-95 transition"
                    title="Correct opponent score (-1)"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Goal Scorers List */}
            {goalScorers.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-xs font-bold text-slate-400 mb-1.5">Goal Scorers:</div>
                <div className="flex flex-wrap gap-2">
                  {goalScorers.map(item => (
                    <div
                      key={item.player.id}
                      className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs text-white font-bold flex items-center gap-1.5"
                    >
                      <span>⚽ {item.player.name.split(' ')[0]}</span>
                      {item.goals > 1 && (
                        <span className="bg-emerald-600 text-white text-[10px] px-1.5 rounded-full font-black">
                          {item.goals}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Playing Time Equity Report */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Playing Time Balance (Fair Play)</span>
              </span>
              <span className="text-[11px] text-slate-500">Target ~50% each</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              {playingTimeData.map(item => {
                const isFair = item.percent >= 40 || totalMatchSeconds < 300;

                return (
                  <div key={item.player.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="font-mono text-slate-400 text-[11px]">#{item.player.number}</span>
                        <span className={item.isAbsent ? 'text-slate-400 line-through decoration-rose-500/50' : ''}>{item.player.name}</span>
                        {item.isAbsent && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                            CNP
                          </span>
                        )}
                        {item.isGoalie && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-400 border border-amber-400/30 px-1 rounded">
                            GK
                          </span>
                        )}
                        {item.status === 'on_field' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>

                      <div className="font-mono text-xs flex items-center gap-2">
                        {item.isAbsent && item.fieldMinutes === 0 && item.benchMinutes === 0 ? (
                          <span className="text-slate-500 text-[11px]">Unavailable</span>
                        ) : isPeriodTracking ? (
                          <span className="text-emerald-400 font-bold font-mono">
                            {item.periodsPlayed}/{game.currentPeriod} periods
                          </span>
                        ) : (
                          <>
                            <span className="text-emerald-400 font-bold">{item.fieldMinutes}m played</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-400">{item.benchMinutes}m sat</span>
                          </>
                        )}
                        <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                          item.isAbsent ? 'bg-slate-800 text-slate-400' : isFair ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {item.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex border border-slate-800/80">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.percent > 65 ? 'bg-blue-500' : item.percent >= 40 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Events Log (Selectable & Copyable) */}
          <div className="space-y-2 select-text">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <History className="w-3.5 h-3.5" />
                <span>Match Event Timeline</span>
              </h3>
              {game.events.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    const text = [...game.events]
                      .reverse()
                      .map(e => `[${formatTime(e.matchSecond)}] ${e.description}`)
                      .join('\n');
                    try {
                      await navigator.clipboard.writeText(text);
                    } catch {
                      window.prompt('Match Events:', text);
                    }
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 select-none active:scale-95 transition"
                  title="Copy timeline events to clipboard"
                >
                  Copy Timeline
                </button>
              )}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5 select-text cursor-text">
              {game.events.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-3 select-none">No events recorded yet.</div>
              ) : (
                [...game.events].reverse().map(evt => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-2 text-xs py-1 border-b border-slate-800/50 last:border-0 select-text"
                  >
                    <span className="font-mono font-bold text-slate-400 text-[10px] w-10 flex-shrink-0 pt-0.5 select-text">
                      {formatTime(evt.matchSecond)}
                    </span>
                    <span className="text-slate-200 select-text">{evt.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2 or Default: Match History */}
      {(!game || activeSubTab === 'history') && (
        <MatchHistoryList
          games={savedGames}
          team={team}
          players={players}
          onSelectGame={onSelectPastGame}
          onDeleteGame={onDeleteSavedGame}
        />
      )}

      {/* Dedicated bottom spacer to prevent footer navbar overlap */}
      <div className="h-28 w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
