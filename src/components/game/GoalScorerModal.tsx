import React from 'react';
import { Game, Player, Team } from '../../types/soccer';
import { X, Award, Shield } from 'lucide-react';
import { celebrateGoal } from '../../utils/celebration';

interface GoalScorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  players: Player[];
  game: Game;
  onSelectScorer: (playerId?: string) => void;
}

export const GoalScorerModal: React.FC<GoalScorerModalProps> = ({
  isOpen,
  onClose,
  team,
  players,
  game,
  onSelectScorer,
}) => {
  if (!isOpen) return null;

  // Separate active on-field players from bench players
  const fieldPlayers = players.filter(p => game.playerStates[p.id]?.status === 'on_field');
  const benchPlayers = players.filter(p => game.playerStates[p.id]?.status === 'on_bench');

  const handlePickPlayer = (playerId?: string) => {
    onSelectScorer(playerId);
    celebrateGoal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-800/60 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-base shadow">
              ⚽
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">
                Goal Scored!
              </h3>
              <p className="text-[11px] text-emerald-400 font-medium">
                Who scored for {team.name}?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Players List */}
        <div className="p-3 overflow-y-auto space-y-3 divide-y divide-slate-800/60">
          {/* On Pitch Players */}
          {fieldPlayers.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>On Pitch Now</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {fieldPlayers.map(p => {
                  const state = game.playerStates[p.id];
                  const goals = state?.goals || 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePickPlayer(p.id)}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-950/80 hover:border-emerald-600/80 border border-slate-700/60 text-white active:scale-[0.98] transition group text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          p.canPlayGK ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-white'
                        }`}>
                          {p.number}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs truncate group-hover:text-emerald-300">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {state?.assignedRole || p.preferredPositions[0]}
                          </div>
                        </div>
                      </div>

                      {goals > 0 && (
                        <span className="text-[10px] font-black bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded-full">
                          ⚽ {goals}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bench Players */}
          {benchPlayers.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                On Bench
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {benchPlayers.map(p => {
                  const state = game.playerStates[p.id];
                  const goals = state?.goals || 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePickPlayer(p.id)}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white active:scale-[0.98] transition text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {p.number}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Bench
                          </div>
                        </div>
                      </div>

                      {goals > 0 && (
                        <span className="text-[10px] font-black bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded-full">
                          ⚽ {goals}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer: Opponent Own Goal / Unassisted */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 space-y-2">
          <button
            onClick={() => handlePickPlayer(undefined)}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span>Opponent Own Goal / Unassigned (+1)</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-1.5 text-center text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
