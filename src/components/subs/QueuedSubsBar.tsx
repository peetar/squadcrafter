import React from 'react';
import { Game, Player, Formation } from '../../types/soccer';
import { Check, X, ArrowRight, RefreshCw } from 'lucide-react';
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
  if (game.queuedSubs.length === 0) return null;

  const handleConfirm = () => {
    playRefereeWhistle();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 50, 150]);
    }
    onConfirmSubs();
  };

  return (
    <div className="fixed bottom-14 left-0 right-0 z-20 px-3 py-2 pointer-events-none">
      <div className="max-w-lg mx-auto bg-slate-900/98 backdrop-blur border-2 border-emerald-500/80 rounded-2xl p-3 shadow-2xl pointer-events-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Queued Substitutions ({game.queuedSubs.length})</span>
          </div>
          <button
            onClick={onClearAll}
            className="text-[11px] text-slate-400 hover:text-slate-200 active:scale-95 transition"
          >
            Clear All
          </button>
        </div>

        {/* List of staged swaps */}
        <div className="py-2 space-y-1.5 max-h-36 overflow-y-auto">
          {game.queuedSubs.map(q => {
            const pIn = players.find(p => p.id === q.playerInId);
            const pOut = players.find(p => p.id === q.playerOutId);
            const slot = formation.slots.find(s => s.id === q.targetSlotId);

            return (
              <div
                key={q.id}
                className="flex items-center justify-between bg-slate-800/80 rounded-xl px-2.5 py-1.5 text-xs border border-slate-700/60"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400">
                    +{pIn?.name.split(' ')[0]} <span className="text-[10px] font-mono text-emerald-500">#{pIn?.number}</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-bold text-slate-300">
                    -{pOut?.name.split(' ')[0]} <span className="text-[10px] font-mono text-slate-400">#{pOut?.number}</span>
                  </span>
                  {slot && (
                    <span className="text-[10px] font-mono bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded">
                      {slot.role}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onCancelSub(q.id)}
                  className="text-slate-400 hover:text-red-400 p-1 rounded-md active:scale-90"
                  title="Remove this swap"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Big Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full mt-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Confirm {game.queuedSubs.length === 1 ? 'Substitution' : 'All Substitutions'} Now</span>
        </button>
      </div>
    </div>
  );
};
