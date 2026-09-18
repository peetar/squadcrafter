import React from 'react';
import { Player, Game, Formation } from '../../types/soccer';
import { 
  suggestSubsForFieldPlayer, 
  suggestSubsForBenchPlayer, 
  SubRecommendation 
} from '../../services/subSuggester';
import { X, ArrowRight, Clock, Flame, Shield, Check, Plus } from 'lucide-react';
import { formatTime } from '../../utils/celebration';

interface SingleSubModalProps {
  player: Player;
  game: Game;
  players: Player[];
  formation: Formation;
  onClose: () => void;
  onQueueSub: (playerOutId: string, playerInId: string, targetSlotId?: string) => void;
  onDirectSwap: (playerOutId: string, playerInId: string, targetSlotId?: string) => void;
}

export const SingleSubModal: React.FC<SingleSubModalProps> = ({
  player,
  game,
  players,
  formation,
  onClose,
  onQueueSub,
  onDirectSwap,
}) => {
  const pState = game.playerStates[player.id];
  const isOnField = pState?.status === 'on_field';

  // Get recommendations
  let recommendations: SubRecommendation[] = [];
  if (isOnField) {
    recommendations = suggestSubsForFieldPlayer(
      player,
      players,
      formation,
      game.playerStates,
      game.cleanGoalieSwaps
    );
  } else {
    recommendations = suggestSubsForBenchPlayer(
      player,
      players,
      formation,
      game.playerStates,
      game.cleanGoalieSwaps
    );
  }

  const handleQueue = (rec: SubRecommendation) => {
    onQueueSub(rec.playerOut.id, rec.playerIn.id, rec.targetSlotId);
    onClose();
  };

  const handleDirect = (rec: SubRecommendation) => {
    onDirectSwap(rec.playerOut.id, rec.playerIn.id, rec.targetSlotId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">
                {isOnField ? 'Substitute Out: ' : 'Substitute In: '}
                <span className="text-emerald-400">{player.name}</span>
              </h3>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                #{player.number}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOnField 
                ? `Currently on pitch (${pState?.assignedRole || 'Field'}) • Stint: ${formatTime(pState?.currentStintSeconds || 0)}`
                : `Currently sitting on bench • Sat: ${formatTime(pState?.currentStintSeconds || 0)}`
              }
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Candidates List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Recommended Candidates</span>
            <span className="text-[11px] text-slate-500">Based on rest & position</span>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/80">
              No eligible candidates found for substitution under current rules.
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const otherPlayer = isOnField ? rec.playerIn : rec.playerOut;
              const otherState = game.playerStates[otherPlayer.id];

              return (
                <div
                  key={otherPlayer.id}
                  className={`p-3 rounded-2xl border transition ${
                    idx === 0 
                      ? 'bg-slate-800/90 border-emerald-500/50 shadow-md' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        otherPlayer.canPlayGK ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'
                      }`}>
                        #{otherPlayer.number}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                          <span>{otherPlayer.name}</span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                              Top Pick
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{rec.reason}</span>
                          {otherState?.isTired && (
                            <span className="text-red-400 flex items-center gap-0.5 font-semibold">
                              • <Flame className="w-2.5 h-2.5 fill-current" /> Tired
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Swap Role Badge */}
                    <span className="text-xs font-mono font-bold bg-slate-800 text-slate-200 px-2 py-1 rounded-lg border border-slate-700">
                      {rec.role}
                    </span>
                  </div>

                  {/* Actions: Queue vs Swap Now */}
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleQueue(rec)}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Queue Swap</span>
                    </button>

                    <button
                      onClick={() => handleDirect(rec)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white rounded-xl shadow flex items-center justify-center gap-1 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Swap Now</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
