import React, { useState } from 'react';
import { Player, Game, Formation } from '../../types/soccer';
import { formatTime, formatPlayerMinutesRatio } from '../../utils/celebration';
import { 
  Users, 
  Shuffle, 
  RefreshCw, 
  Clock, 
  Flame, 
  Shield, 
  Star, 
  Lock, 
  FastForward, 
  Flag, 
  UserX, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Plus 
} from 'lucide-react';

interface BenchTrayProps {
  game: Game;
  players: Player[];
  formation: Formation;
  onPlayerTap: (player: Player) => void;
  onOpenBenchSwap: () => void;
  onDirectSubTrigger: (player: Player) => void;
  onAdvancePeriod?: () => void;
  onEndGame?: () => void;
  onToggleAvailability?: (playerId: string) => void;
}

export const BenchTray: React.FC<BenchTrayProps> = ({
  game,
  players,
  formation,
  onPlayerTap,
  onOpenBenchSwap,
  onDirectSubTrigger,
  onAdvancePeriod,
  onEndGame,
  onToggleAvailability,
}) => {
  const [showAbsentList, setShowAbsentList] = useState(true);

  const benchPlayers = players.filter(p => {
    const s = game.playerStates[p.id];
    return s && s.status === 'on_bench';
  });

  const absentPlayers = players.filter(p => {
    const s = game.playerStates[p.id];
    return s && s.status === 'absent';
  });

  // Sort descending by current sit time
  const sortedBench = [...benchPlayers].sort((a, b) => {
    const sA = game.playerStates[a.id]?.currentStintSeconds || 0;
    const sB = game.playerStates[b.id]?.currentStintSeconds || 0;
    return sB - sA;
  });

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full px-3 py-2 pb-32">
      {/* Header & Quick Match/Mass Sub Controls */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800 gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Bench Roster ({sortedBench.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Players sitting longest shown first
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onAdvancePeriod && game.currentPeriod < game.periodsTotal && (
            <button
              onClick={onAdvancePeriod}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 border border-blue-500/50 font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
              title={`Advance to ${game.periodsTotal === 4 ? `Q${game.currentPeriod + 1}` : '2nd Half'}`}
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span>{game.periodsTotal === 4 ? `Q${game.currentPeriod + 1}` : '2nd Half'}</span>
            </button>
          )}

          {onEndGame && (
            <button
              onClick={() => {
                if (confirm('End match now and view fair-play summary?')) {
                  onEndGame();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 font-bold text-xs rounded-xl transition active:scale-95"
              title="End Match"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>End</span>
            </button>
          )}

          {sortedBench.length > 0 && (
            <button
              onClick={onOpenBenchSwap}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Full Bench Swap</span>
            </button>
          )}
        </div>
      </div>

      {/* Bench Player Cards */}
      <div className="py-3 space-y-2.5 overflow-y-auto">
        {sortedBench.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">No Players on the Bench</h4>
            <p className="text-xs text-slate-400 mt-1">
              All available players are currently on the pitch.
            </p>
          </div>
        ) : (
          sortedBench.map((player, idx) => {
            const state = game.playerStates[player.id];
            const sitSeconds = state?.currentStintSeconds || 0;
            const sitMinutes = Math.floor(sitSeconds / 60);
            const totalFieldMinutes = Math.floor((state?.totalFieldSeconds || 0) / 60);
            const totalBenchMinutes = Math.floor((state?.totalBenchSeconds || 0) / 60);

            const isQueued = game.queuedSubs.some(q => q.playerInId === player.id);

            // Alert color for long sitting
            const isLongSit = sitMinutes >= 10;
            const isMediumSit = sitMinutes >= 6;

            return (
              <div
                key={player.id}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isQueued
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-md'
                    : isLongSit
                    ? 'bg-red-950/30 border-red-800/80 animate-soft-pulse'
                    : isMediumSit
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Left: Player Avatar & Details */}
                <div 
                  onClick={() => onPlayerTap(player)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-base shadow ${
                    player.canPlayGK ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-white border border-slate-700'
                  }`}>
                    {player.number}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-white truncate">
                      <span className="truncate">{player.name}</span>
                      {player.canPlayGK && (
                        <span className="text-[10px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/40 px-1 rounded">
                          GK
                        </span>
                      )}
                      {state?.tacticalOverride?.type === 'FORCE' && (
                        <Lock className="w-3 h-3 text-purple-400" />
                      )}
                      {state?.tacticalOverride?.type === 'FAVOR' && (
                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-slate-300">
                        {player.preferredPositions.join(', ')}
                      </span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-300">
                        Played: {formatPlayerMinutesRatio(state, game.timeTrackingMode, game.currentPeriod)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Sit Time & Sub Action */}
                <div className="flex items-center gap-2.5">
                  {/* Sit timer badge */}
                  <div className="text-right">
                    <div className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                      isLongSit
                        ? 'bg-red-950 text-red-300 border-red-700'
                        : isMediumSit
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{formatPlayerMinutesRatio(state, game.timeTrackingMode, game.currentPeriod)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Sat: {formatTime(sitSeconds)}
                    </div>
                  </div>

                  {/* Sub In Button */}
                  <button
                    onClick={() => onDirectSubTrigger(player)}
                    className="p-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 active:scale-90 text-emerald-300 border border-emerald-500/40 rounded-xl transition shadow-sm"
                    title="Suggest Sub for this player"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Inactive / Cannot Play (CNP) Section */}
        {absentPlayers.length > 0 && (
          <div className="pt-4 space-y-2.5">
            <button
              onClick={() => setShowAbsentList(!showAbsentList)}
              className="w-full flex items-center justify-between text-xs font-bold text-rose-400/90 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 px-3.5 py-2.5 rounded-2xl transition"
            >
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-400" />
                <span>Cannot Play / Inactive ({absentPlayers.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Not accruing bench time)
                </span>
              </div>
              {showAbsentList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAbsentList && (
              <div className="space-y-2">
                {absentPlayers.map(player => {
                  const state = game.playerStates[player.id];
                  const totalFieldMinutes = Math.floor((state?.totalFieldSeconds || 0) / 60);

                  return (
                    <div
                      key={player.id}
                      className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition"
                    >
                      {/* Left: Player Avatar & Details */}
                      <div 
                        onClick={() => onPlayerTap(player)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700/60 flex items-center justify-center font-bold text-sm">
                          {player.number}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-300 truncate">
                            <span className="truncate">{player.name}</span>
                            <span className="text-[9px] font-black uppercase bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded-md">
                              CNP
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span>{player.preferredPositions.join(', ')}</span>
                            <span> • {formatPlayerMinutesRatio(state)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Reactivate Button */}
                      {onToggleAvailability && (
                        <button
                          onClick={() => onToggleAvailability(player.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 active:scale-95 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition shadow-sm"
                          title="Activate player to bench"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dedicated bottom spacer to prevent footer navbar overlap */}
        <div className="h-28 w-full shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
};
