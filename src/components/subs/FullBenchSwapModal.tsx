import React, { useState } from 'react';
import { Player, Game, Formation } from '../../types/soccer';
import { suggestFullBenchSwap, SubRecommendation } from '../../services/subSuggester';
import { X, ArrowRight, Shuffle, Check, Plus, Shield, Flame } from 'lucide-react';
import { playRefereeWhistle } from '../../hooks/useGameTimer';

interface FullBenchSwapModalProps {
  game: Game;
  players: Player[];
  formation: Formation;
  onClose: () => void;
  onQueueMultiple: (subs: { playerOutId: string; playerInId: string; targetSlotId: string }[]) => void;
  onConfirmMultipleNow: (subs: { playerOutId: string; playerInId: string; targetSlotId: string }[]) => void;
}

export const FullBenchSwapModal: React.FC<FullBenchSwapModalProps> = ({
  game,
  players,
  formation,
  onClose,
  onQueueMultiple,
  onConfirmMultipleNow,
}) => {
  // Generate initial recommended pairings
  const [pairings, setPairings] = useState<SubRecommendation[]>(() => 
    suggestFullBenchSwap(players, formation, game.playerStates, game.cleanGoalieSwaps)
  );

  const handleRemovePairing = (index: number) => {
    setPairings(prev => prev.filter((_, i) => i !== index));
  };

  const handleQueueAll = () => {
    onQueueMultiple(pairings.map(p => ({
      playerOutId: p.playerOut.id,
      playerInId: p.playerIn.id,
      targetSlotId: p.targetSlotId,
    })));
    onClose();
  };

  const handleConfirmNow = () => {
    playRefereeWhistle();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 50, 150]);
    }
    onConfirmMultipleNow(pairings.map(p => ({
      playerOutId: p.playerOut.id,
      playerInId: p.playerIn.id,
      targetSlotId: p.targetSlotId,
    })));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 flex items-center justify-center">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Full Bench Swap</h3>
              <p className="text-xs text-slate-400">
                {game.cleanGoalieSwaps ? 'Goalie locked (Clean Goalie Swaps)' : 'All positions eligible'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pairings List */}
        <div className="p-4 max-h-[55vh] overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Proposed Rotations ({pairings.length})</span>
            <span className="text-[11px] text-slate-500">Pairs freshest bench with tired field</span>
          </div>

          {pairings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/80">
              No bench players available for rotation.
            </div>
          ) : (
            pairings.map((pair, idx) => {
              const outState = game.playerStates[pair.playerOut.id];
              const inState = game.playerStates[pair.playerIn.id];

              return (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Coming In (Bench) */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{pair.playerIn.number}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-emerald-400 truncate">
                          +{pair.playerIn.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sat {Math.floor((inState?.currentStintSeconds || 0) / 60)}m
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />

                    {/* Coming Out (Field) */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        #{pair.playerOut.number}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-300 truncate">
                          -{pair.playerOut.name.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>Pitch {Math.floor((outState?.currentStintSeconds || 0) / 60)}m</span>
                          {outState?.isTired && <Flame className="w-2.5 h-2.5 text-red-400 fill-current" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Slot role badge & delete */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      {pair.role}
                    </span>

                    <button
                      onClick={() => handleRemovePairing(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Skip this rotation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {pairings.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2.5">
            <button
              onClick={handleQueueAll}
              className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 font-bold text-xs sm:text-sm rounded-2xl border border-emerald-500/40 flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Queue {pairings.length} Subs</span>
            </button>

            <button
              onClick={handleConfirmNow}
              className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Swap {pairings.length} Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
