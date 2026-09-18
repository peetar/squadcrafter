import React, { useState, useEffect } from 'react';
import { Game, Player, Team } from '../../types/soccer';
import { formatTime, celebrateGoal } from '../../utils/celebration';
import { 
  Trophy, 
  Award, 
  Clock, 
  Copy, 
  Check, 
  X, 
  Share2, 
  History, 
  CheckCircle2, 
  TrendingUp,
  Flame,
  Users
} from 'lucide-react';

interface MatchRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  team: Team | null;
  players: Player[];
  isNewlyFinished?: boolean;
}

export const MatchRecapModal: React.FC<MatchRecapModalProps> = ({
  isOpen,
  onClose,
  game,
  team,
  players,
  isNewlyFinished = false,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    if (isOpen && isNewlyFinished && game) {
      if (game.scoreUs >= game.scoreThem) {
        celebrateGoal();
      }
    }
  }, [isOpen, isNewlyFinished, game]);

  if (!isOpen || !game || !team) return null;

  const isWin = game.scoreUs > game.scoreThem;
  const isDraw = game.scoreUs === game.scoreThem;
  const isLoss = game.scoreUs < game.scoreThem;

  const totalMatchSeconds = Math.max(game.totalElapsedSeconds, 1);
  const totalMatchMinutes = Math.round(totalMatchSeconds / 60);

  // Goal scorers
  const goalScorers = players
    .map(p => ({ player: p, goals: game.playerStates[p.id]?.goals || 0 }))
    .filter(item => item.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  // Playing time data
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
    };
  }).sort((a, b) => b.fieldSeconds - a.fieldSeconds);

  // Fair Play stats
  const minPlayingTimePct = playingTimeData.length > 0 
    ? Math.min(...playingTimeData.map(d => d.percent)) 
    : 0;
  const allMetFairPlay = minPlayingTimePct >= 35 || totalMatchSeconds < 300;

  // Date formatting
  const matchDateStr = game.date 
    ? new Date(game.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

  // Copy parent summary text
  const handleCopySummary = async () => {
    const goalsText = goalScorers.length > 0
      ? goalScorers.map(g => `${g.player.name.split(' ')[0]}${g.goals > 1 ? ` (${g.goals})` : ''}`).join(', ')
      : 'None';

    const text = [
      `⚽ SquadCrafter Match Recap`,
      `${team.name} ${game.scoreUs} - ${game.scoreThem} ${game.opponentName}`,
      `Date: ${matchDateStr}`,
      `Outcome: ${isWin ? 'Victory 🏆' : isDraw ? 'Draw 🤝' : 'Hard-fought match ⚽'}`,
      `Goals: ${goalsText}`,
      `Match Length: ${totalMatchMinutes}m (${game.formatPlayerCount}v${game.formatPlayerCount})`,
      `Great teamwork and sportsmanship today!`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2400);
    } catch {
      window.prompt('Copy match summary:', text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header with Result Banner */}
        <div className={`px-5 py-4 border-b text-white flex items-center justify-between ${
          isWin 
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-800/60' 
            : isDraw 
            ? 'bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-blue-800/60' 
            : 'bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-amber-800/60'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-md ${
              isWin ? 'bg-emerald-600 text-white' : isDraw ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {isWin ? '🏆' : isDraw ? '🤝' : '⚽'}
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                {isWin ? 'Match Victory' : isDraw ? 'Match Draw' : 'Match Concluded'}
              </div>
              <h3 className="text-base font-black text-white leading-tight">
                Post-Game Recap
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Big Score Card */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {matchDateStr}
            </div>

            <div className="flex items-center justify-center gap-4 py-1">
              <div className="text-right flex-1 min-w-0">
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {team.name}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">Our Team</div>
              </div>

              <div className="flex items-center gap-2 font-mono text-3xl font-black bg-slate-900 px-3 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
                <span className={isWin ? 'text-emerald-400' : 'text-white'}>{game.scoreUs}</span>
                <span className="text-slate-600 text-xl">-</span>
                <span className={isLoss ? 'text-red-400' : 'text-slate-300'}>{game.scoreThem}</span>
              </div>

              <div className="text-left flex-1 min-w-0">
                <div className="text-sm sm:text-base font-extrabold text-white truncate">
                  {game.opponentName}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">Opponent</div>
              </div>
            </div>

            {/* Quick Match Specs */}
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
              <span>{totalMatchMinutes} min played</span>
              <span>•</span>
              <span>{game.formatPlayerCount}v{game.formatPlayerCount}</span>
              <span>•</span>
              <span>{game.periodsTotal} Periods</span>
            </div>
          </div>

          {/* Goal Scorers */}
          {goalScorers.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>⚽</span>
                <span>Team Goal Scorers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {goalScorers.map(item => (
                  <div
                    key={item.player.id}
                    className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs text-white font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <span>#{item.player.number}</span>
                    <span>{item.player.name}</span>
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

          {/* Playing Time & Fair Play Balance */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Playing Time Equity</span>
              </div>
              {allMetFairPlay ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Fair Play Target Met</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  Time Imbalance
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
              {playingTimeData.map(item => (
                <div key={item.player.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-white truncate max-w-[160px]">
                      <span className="font-mono text-slate-400 text-[11px]">#{item.player.number}</span>
                      <span className="truncate">{item.player.name}</span>
                      {item.isGoalie && (
                        <span className="text-[9px] bg-amber-400/20 text-amber-400 border border-amber-400/30 px-1 rounded">
                          GK
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-xs flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">{item.fieldMinutes}m</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-slate-400">{item.benchMinutes}m sat</span>
                      <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden flex border border-slate-800/80">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.percent >= 40 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Timeline Log */}
          {game.events.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Match Timeline ({game.events.length} events)</span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs no-scrollbar">
                {game.events.map(evt => (
                  <div key={evt.id} className="flex items-start gap-2 py-0.5 text-slate-300">
                    <span className="font-mono font-bold text-[10px] text-slate-400 w-9 shrink-0 pt-0.5">
                      {formatTime(evt.matchSecond)}
                    </span>
                    <span className="text-slate-200 text-xs leading-tight">{evt.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleCopySummary}
              className={`w-full py-2.5 px-4 font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition active:scale-95 ${
                copiedSummary
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
              }`}
            >
              {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSummary ? 'Summary Copied to Clipboard!' : 'Copy Parent Summary (Text / WhatsApp)'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow transition active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
