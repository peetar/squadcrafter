import React, { useState } from 'react';
import { Game, Player, Formation } from '../../types/soccer';
import { Check, X, ArrowRight, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { playRefereeWhistle } from '../../hooks/useGameTimer';

interface QueuedSubsBarProps {
  game: Game;
  players: Player[];
  formation: Formation;
  onConfirmSubs: () => void;
  onCancelSub: (subId: string) => void;
  onClearAll: () => void;
}

export const QueuedSubsBar: React.FC<QueuedSubsBarProps> = ({
  game,
  players,
  formation,
  onConfirmSubs,
  onCancelSub,
  onClearAll,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (game.queuedSubs.length === 0) return null;

  const handleConfirm = () => {
    playRefereeWhistle();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 50, 150]);
    }
    setIsExpanded(false);
    onConfirmSubs();
  };

  // Build a concise summary of who is coming in
  const subCount = game.queuedSubs.length;
  const firstSub = game.queuedSubs[0];
  const pIn1 = players.find(p => p.id === firstSub.playerInId);
  const pOut1 = players.find(p => p.id === firstSub.playerOutId);

  let summaryText = '';
  if (subCount === 1) {
    summaryText = `+${pIn1?.name.split(' ')[0] || '#' + pIn1?.number} for -${pOut1?.name.split(' ')[0] || '#' + pOut1?.number}`;
  } else if (subCount === 2) {
    const pIn2 = players.find(p => p.id === game.queuedSubs[1].playerInId);
    summaryText = `+${pIn1?.name.split(' ')[0]}, +${pIn2?.name.split(' ')[0]}`;
  } else {
    const pIn2 = players.find(p => p.id === game.queuedSubs[1].playerInId);
    summaryText = `+${pIn1?.name.split(' ')[0]}, +${pIn2?.name.split(' ')[0]} (+${subCount - 2} more)`;
  }

  return (
    <div className="fixed top-[49px] sm:top-[53px] left-0 right-0 z-40 px-2.5 sm:px-4 pointer-events-none flex flex-col items-center">
      <div className="max-w-md w-full bg-slate-900/98 backdrop-blur-md border border-emerald-500/80 rounded-2xl shadow-2xl pointer-events-auto text-white transition-all overflow-hidden">
        {/* Compact Single-Row Bar (Default) */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          {/* Left: Indicator & Quick Summary (Tappable to expand details) */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 min-w-0 flex-1 text-left active:opacity-80 py-0.5"
            title="Tap to see staged substitutions details"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-sm">
                {subCount}
              </span>
            </div>

            <div className="flex items-center gap-1 min-w-0 text-xs">
              <span className="font-extrabold text-white truncate max-w-[140px] sm:max-w-[180px]">
                {summaryText}
              </span>
              <span className="text-slate-400 text-[10px] shrink-0 flex items-center gap-0.5 ml-0.5">
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </span>
            </div>
          </button>

          {/* Right: Quick Clear & Confirm Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClearAll}
              className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-slate-800 rounded-lg active:scale-95 transition"
              title="Clear all queued substitutions"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
              title="Execute all queued substitutions now"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Sub Now</span>
            </button>
          </div>
        </div>

        {/* Expandable Details Drawer */}
        {isExpanded && (
          <div className="border-t border-slate-800 px-3 py-2 space-y-2 bg-slate-950/60 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-0.5">
              <span>Staged Rotations ({subCount})</span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-red-400 hover:text-red-300 active:scale-95"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {game.queuedSubs.map(q => {
                const pIn = players.find(p => p.id === q.playerInId);
                const pOut = players.find(p => p.id === q.playerOutId);
                const slot = formation.slots.find(s => s.id === q.targetSlotId);

                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between bg-slate-800/90 rounded-xl px-2.5 py-1.5 text-xs border border-slate-700/60 shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-bold text-emerald-400 truncate">
                        +{pIn?.name.split(' ')[0]} <span className="text-[10px] font-mono text-emerald-500">#{pIn?.number}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="font-bold text-slate-300 truncate">
                        -{pOut?.name.split(' ')[0]} <span className="text-[10px] font-mono text-slate-400">#{pOut?.number}</span>
                      </span>
                      {slot && (
                        <span className="text-[9px] font-mono bg-slate-700 text-slate-300 px-1 py-0.2 rounded shrink-0">
                          {slot.role}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onCancelSub(q.id)}
                      className="text-slate-400 hover:text-red-400 p-1 rounded-md active:scale-90 ml-1.5 shrink-0"
                      title="Remove this swap"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full mt-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm All {subCount} Substitutions Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
