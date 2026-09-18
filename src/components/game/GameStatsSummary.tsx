import React from 'react';
import { Game, Player, Team } from '../../types/soccer';
import { formatTime } from '../../utils/celebration';
import { BarChart3, Clock, Flame, Award, ChevronRight, CheckCircle2, History, AlertTriangle } from 'lucide-react';

interface GameStatsSummaryProps {
  game: Game;
  team: Team;
  players: Player[];
  onAdvancePeriod: () => void;
  onEndGame: () => void;
}

export const GameStatsSummary: React.FC<GameStatsSummaryProps> = ({
  game,
  team,
  players,
  onAdvancePeriod,
  onEndGame,
}) => {
  const totalMatchSeconds = Math.max(game.totalElapsedSeconds, 1);

  // Goal scorers
  const goalScorers = players
    .map(p => ({ player: p, goals: game.playerStates[p.id]?.goals || 0 }))
    .filter(item => item.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  // Sorted by playing time percentage
  const playingTimeData = players.map(p => {
    const s = game.playerStates[p.id];
    const fieldSec = s?.totalFieldSeconds || 0;
    const benchSec = s?.totalBenchSeconds || 0;
    const pct = Math.round((fieldSec / totalMatchSeconds) * 100);

    return {
      player: p,
      fieldSeconds: fieldSec,
      benchSeconds: benchSec,
      fieldMinutes: Math.round(fieldSec / 60),
      benchMinutes: Math.round(benchSec / 60),
      percent: Math.min(pct, 100),
      isGoalie: p.canPlayGK,
      goals: s?.goals || 0,
      status: s?.status || 'on_bench',
    };
  }).sort((a, b) => b.fieldSeconds - a.fieldSeconds);

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full px-3 py-2 pb-32 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Fair Play & Match Stats</span>
          </h2>
          <p className="text-xs text-slate-400">
            Total match time: {formatTime(game.totalElapsedSeconds)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {game.currentPeriod < game.periodsTotal && (
            <button
              onClick={onAdvancePeriod}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow transition"
            >
              {game.periodsTotal === 4 ? `Next Quarter (Q${game.currentPeriod + 1})` : '2nd Half'}
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('End this match and save to history?')) {
                onEndGame();
              }
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 active:scale-95 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition"
          >
            End Match
          </button>
        </div>
      </div>

      {/* Score and Goal Scorers Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {team.name} vs {game.opponentName}
            </div>
            <div className="font-mono text-2xl font-black text-white mt-1">
              <span className="text-emerald-400">{game.scoreUs}</span>
              <span className="text-slate-600 mx-2">-</span>
              <span className="text-slate-300">{game.scoreThem}</span>
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

        {/* Goal Scorers List */}
        {goalScorers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80">
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
            Playing Time Balance (Fair Play)
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
                    <span>{item.player.name}</span>
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
                    <span className="text-emerald-400 font-bold">{item.fieldMinutes}m played</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">{item.benchMinutes}m sat</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                      isFair ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
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

      {/* Match Events Log */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          <span>Match Event Timeline</span>
        </h3>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5">
          {game.events.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-3">No events recorded yet.</div>
          ) : (
            [...game.events].reverse().map(evt => (
              <div
                key={evt.id}
                className="flex items-start gap-2 text-xs py-1 border-b border-slate-800/50 last:border-0"
              >
                <span className="font-mono font-bold text-slate-400 text-[10px] w-10 flex-shrink-0 pt-0.5">
                  {formatTime(evt.matchSecond)}
                </span>
                <span className="text-slate-200">{evt.description}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dedicated bottom spacer to prevent footer navbar overlap */}
      <div className="h-28 w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
