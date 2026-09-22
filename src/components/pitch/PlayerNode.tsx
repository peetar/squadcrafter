import React from 'react';
import { Player, PlayerMatchState, QueuedSub } from '../../types/soccer';
import { formatTime, formatPlayerMinutesRatio } from '../../utils/celebration';
import { Flame, Star, Lock, RefreshCw } from 'lucide-react';

interface PlayerNodeProps {
  player: Player;
  state: PlayerMatchState;
  role: string;
  x: number; // 0 - 100%
  y: number; // 0 - 100%
  timeTrackingMode?: 'minutes' | 'periods';
  currentPeriod?: number;
  queuedSub?: QueuedSub;
  incomingPlayer?: Player;
  isHoveredTarget?: boolean;
  isDragSource?: boolean;
  onTap: (player: Player) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const PlayerNode: React.FC<PlayerNodeProps> = ({
  player,
  state,
  role,
  x,
  y,
  timeTrackingMode = 'minutes',
  currentPeriod = 1,
  queuedSub,
  incomingPlayer,
  isHoveredTarget = false,
  isDragSource = false,
  onTap,
  onPointerDown,
}) => {
  const isGK = role === 'GK';
  const hasGoals = state.goals > 0;
  const isTired = state.isTired;
  const isQueued = Boolean(queuedSub);

  // Split name for compact mobile display: "Lucas H."
  const nameParts = player.name.trim().split(' ');
  const displayName = nameParts.length > 1 
    ? `${nameParts[0]} ${nameParts[1][0]}.` 
    : nameParts[0];

  return (
    <div
      data-drop-target="field"
      data-player-id={player.id}
      onPointerDown={onPointerDown}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing group touch-none select-none z-10 transition-all ${
        isDragSource ? 'opacity-40 scale-95' : isHoveredTarget ? 'scale-120 z-30' : ''
      }`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* Queued Sub Indicator Bubble */}
      {isQueued && incomingPlayer && (
        <div className="absolute -top-6 whitespace-nowrap bg-amber-500 text-slate-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 animate-bounce z-20">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          <span>In: #{incomingPlayer.number}</span>
        </div>
      )}

      {/* Main Jersey Token */}
      <div className="relative">
        <div
          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-extrabold text-sm sm:text-base shadow-lg border-2 transition-all ${
            isGK
              ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-amber-900/30'
              : 'bg-blue-600 text-white border-blue-300 shadow-blue-950/40'
          } ${
            isHoveredTarget
              ? 'ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-xl shadow-emerald-500/50 scale-110 animate-pulse'
              : isTired 
              ? 'ring-4 ring-red-500/80 ring-offset-2 ring-offset-slate-900 animate-pulse' 
              : isQueued
              ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900'
              : 'group-hover:scale-105'
          }`}
        >
          {player.number}
        </div>

        {/* Goal Badge */}
        {hasGoals && (
          <div className="absolute -bottom-1 -right-1 bg-white text-slate-950 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black border border-slate-300 shadow">
            ⚽{state.goals > 1 ? state.goals : ''}
          </div>
        )}

        {/* Tired Flame Badge */}
        {isTired && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-black shadow animate-bounce">
            <Flame className="w-3 h-3 fill-current" />
          </div>
        )}

        {/* FORCE Tactical Override Badge */}
        {state.tacticalOverride?.type === 'FORCE' && (
          <div className="absolute -top-1 -left-1 bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-black shadow" title="Position FORCED">
            <Lock className="w-2.5 h-2.5" />
          </div>
        )}

        {/* Starter Star Badge */}
        {player.isStarter && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 rounded-full w-4 h-4 flex items-center justify-center text-[9px] shadow border border-amber-200 z-20" title="Designated Starter">
            ⭐
          </div>
        )}

        {/* Playmaker Attribute Badge */}
        {player.playmakerAttributes && player.playmakerAttributes.length > 0 && (
          <div className="absolute -bottom-1 -left-1 bg-slate-900 border border-slate-700 text-white rounded-full px-1 py-0.2 text-[8px] flex items-center shadow" title={player.playmakerAttributes.join(', ')}>
            {player.playmakerAttributes[0] === 'stopper' ? '🛡️' :
             player.playmakerAttributes[0] === 'scorer' ? '🎯' :
             player.playmakerAttributes[0] === 'shooter' ? '🏀' :
             player.playmakerAttributes[0] === 'ball_handler' ? '⚡' : '💪'}
          </div>
        )}
      </div>

      {/* Player Label Pill (Name + Role + Stint Time) */}
      <div className="mt-1 flex flex-col items-center pointer-events-none">
        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold shadow flex items-center gap-1 border max-w-[76px] truncate transition-colors ${
          isHoveredTarget 
            ? 'bg-emerald-900 text-emerald-200 border-emerald-500' 
            : 'bg-slate-900/90 text-white border-slate-700/60'
        }`}>
          <span className="truncate">{displayName}</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
            {role}
          </span>
        </div>

        {/* Played / Total Minutes or Periods Ratio */}
        <span 
          title={`Played ${timeTrackingMode === 'periods' ? `${(state.periodsPlayedCount || 0) + (state.status === 'on_field' ? 1 : 0)}/${currentPeriod} periods` : `${Math.floor((state.totalFieldSeconds || 0) / 60)}m of ${Math.floor(((state.totalFieldSeconds || 0) + (state.totalBenchSeconds || 0)) / 60)}m eligible`}`}
          className={`text-[9px] font-mono font-bold px-1 rounded mt-0.5 shadow-sm ${
            state.currentStintSeconds >= 720 
              ? 'bg-red-950/80 text-red-300 border border-red-800/50' 
              : state.currentStintSeconds >= 480
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
              : 'bg-black/50 text-slate-300'
          }`}
        >
          {formatPlayerMinutesRatio(state, timeTrackingMode, currentPeriod)}
        </span>
      </div>
    </div>
  );
};
