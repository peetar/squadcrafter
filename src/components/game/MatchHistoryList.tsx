import React from 'react';
import { Game, Player, Team } from '../../types/soccer';
import { formatTime } from '../../utils/celebration';
import { History, Calendar, Trophy, Trash2, ArrowRight, Award, Shield } from 'lucide-react';

interface MatchHistoryListProps {
  games: Game[];
  team: Team;
  players: Player[];
  onSelectGame: (game: Game) => void;
  onDeleteGame: (gameId: string) => void;
}

export const MatchHistoryList: React.FC<MatchHistoryListProps> = ({
  games,
  team,
  players,
  onSelectGame,
  onDeleteGame,
}) => {
  const teamGames = games.filter(g => g.teamId === team.id || !g.teamId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
        <span className="flex items-center gap-1.5 text-slate-300">
          <History className="w-4 h-4 text-emerald-400" />
          <span>Past Matches ({teamGames.length})</span>
        </span>
        <span className="text-[11px] text-slate-500">Tap to view full recap & minutes</span>
      </div>

      {teamGames.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📜
          </div>
          <h4 className="text-sm font-bold text-slate-200">No Match History Yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            When you complete a game and tap <strong>"End Match"</strong>, the full post-game recap with playing minutes and goal scorers will be saved here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {teamGames.map(game => {
            const isWin = game.scoreUs > game.scoreThem;
            const isDraw = game.scoreUs === game.scoreThem;
            const isLoss = game.scoreUs < game.scoreThem;

            const dateStr = game.date 
              ? new Date(game.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

            const matchMinutes = Math.round((game.totalElapsedSeconds || 0) / 60);

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="group relative p-3.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition shadow flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                {/* Left: Result Badge & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-extrabold shadow text-xs shrink-0 ${
                    isWin 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80' 
                      : isDraw 
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/80' 
                      : 'bg-red-950 text-red-300 border border-red-800/80'
                  }`}>
                    <span className="text-[10px] uppercase tracking-wider font-bold">
                      {isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS'}
                    </span>
                    <span className="font-mono text-xs font-black">
                      {game.scoreUs}-{game.scoreThem}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                        vs {game.opponentName}
                      </h4>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>{matchMinutes}m</span>
                      <span>•</span>
                      <span>{game.formatPlayerCount}v{game.formatPlayerCount}</span>
                    </div>
                  </div>
                </div>

                {/* Right: View Action & Delete */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGame(game);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    <span>Recap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete match record vs "${game.opponentName}" (${dateStr})?`)) {
                        onDeleteGame(game.id);
                      }
                    }}
                    className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg transition"
                    title="Delete Match Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
