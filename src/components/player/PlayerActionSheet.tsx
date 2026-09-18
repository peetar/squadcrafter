import React, { useState } from 'react';
import { Player, PlayerMatchState, PositionCategory, TacticalOverrideType } from '../../types/soccer';
import { celebrateGoal, formatTime } from '../../utils/celebration';
import { X, Flame, RefreshCw, Star, Lock, Award, ShieldAlert } from 'lucide-react';

interface PlayerActionSheetProps {
  player: Player;
  state: PlayerMatchState;
  onClose: () => void;
  onRegisterGoal: (playerId: string) => void;
  onToggleTired: (playerId: string) => void;
  onSuggestSub: (player: Player) => void;
  onSetOverride: (playerId: string, type: TacticalOverrideType, category?: PositionCategory) => void;
}

export const PlayerActionSheet: React.FC<PlayerActionSheetProps> = ({
  player,
  state,
  onClose,
  onRegisterGoal,
  onToggleTired,
  onSuggestSub,
  onSetOverride,
}) => {
  const isOnField = state.status === 'on_field';
  const [selectedCategory, setSelectedCategory] = useState<PositionCategory>(
    state.tacticalOverride?.targetCategory || player.preferredPositions[0] || 'MID'
  );

  const handleGoal = () => {
    celebrateGoal();
    onRegisterGoal(player.id);
  };

  const handleOverrideChange = (type: TacticalOverrideType) => {
    if (type === 'NONE') {
      onSetOverride(player.id, 'NONE');
    } else {
      onSetOverride(player.id, type, selectedCategory);
    }
  };

  const categories: PositionCategory[] = ['DEF', 'MID', 'FWD', 'GK'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-inner ${
              state.assignedRole === 'GK' || player.canPlayGK 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-blue-600 text-white'
            }`}>
              #{player.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{player.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOnField ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                }`}>
                  {isOnField ? (state.assignedRole || 'Field') : 'Bench'}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Stint: {formatTime(state.currentStintSeconds)}</span>
                <span>•</span>
                <span>Total Field: {Math.round(state.totalFieldSeconds / 60)}m</span>
                {state.goals > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">⚽ {state.goals} {state.goals === 1 ? 'goal' : 'goals'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="p-4 space-y-3">
          {/* Primary Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Goal Scored */}
            <button
              onClick={handleGoal}
              className="flex items-center justify-center gap-2 py-3 px-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm rounded-2xl shadow-md active:scale-95 transition"
            >
              <span className="text-lg">⚽</span>
              <span>Goal Scored!</span>
            </button>

            {/* Mark Tired */}
            <button
              onClick={() => onToggleTired(player.id)}
              className={`flex items-center justify-center gap-2 py-3 px-3 font-bold text-sm rounded-2xl border transition active:scale-95 ${
                state.isTired
                  ? 'bg-red-950/80 text-red-300 border-red-700 shadow-inner'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700'
              }`}
            >
              <Flame className={`w-4 h-4 ${state.isTired ? 'text-red-400 fill-current animate-bounce' : 'text-slate-400'}`} />
              <span>{state.isTired ? 'Tired (Resting)' : 'Mark Tired'}</span>
            </button>
          </div>

          {/* Suggest Substitution Action */}
          <button
            onClick={() => {
              onSuggestSub(player);
              onClose();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isOnField ? 'Suggest Sub for ' + player.name.split(' ')[0] : 'Suggest Field Position for ' + player.name.split(' ')[0]}</span>
          </button>

          {/* Tactical Overrides Section (FORCE / FAVOR) */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Tactical Override (Development & Fair Play)
              </span>
              {state.tacticalOverride && (
                <span className="text-[10px] text-amber-400 font-bold uppercase">
                  {state.tacticalOverride.type}: {state.tacticalOverride.targetCategory}
                </span>
              )}
            </div>

            {/* Target Category Selector */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[11px] text-slate-400 mr-1">Role:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (state.tacticalOverride && state.tacticalOverride.type !== 'NONE') {
                      onSetOverride(player.id, state.tacticalOverride.type, cat);
                    }
                  }}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Force / Favor / Clear Buttons */}
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => handleOverrideChange('FORCE')}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 border transition active:scale-95 ${
                  state.tacticalOverride?.type === 'FORCE'
                    ? 'bg-purple-900/60 border-purple-500 text-purple-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span>FORCE</span>
                </div>
                <span className="text-[9px] font-normal text-slate-400">Lock position</span>
              </button>

              <button
                onClick={() => handleOverrideChange('FAVOR')}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 border transition active:scale-95 ${
                  state.tacticalOverride?.type === 'FAVOR'
                    ? 'bg-amber-900/60 border-amber-500 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>FAVOR</span>
                </div>
                <span className="text-[9px] font-normal text-slate-400">Try new role</span>
              </button>

              <button
                onClick={() => handleOverrideChange('NONE')}
                className={`py-2 px-1 rounded-xl font-medium border border-slate-700/60 text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 transition active:scale-95 ${
                  !state.tacticalOverride || state.tacticalOverride.type === 'NONE'
                    ? 'border-emerald-500/60 text-emerald-400 font-bold'
                    : ''
                }`}
              >
                <span>Reset</span>
                <span className="block text-[9px] text-slate-500">Normal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
