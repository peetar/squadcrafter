import React from 'react';
import { Formation, Game, Team } from '../../types/soccer';
import { FORMATIONS, getFormationsByPlayerCount } from '../../data/formations';
import { BASKETBALL_FORMATIONS } from '../../data/basketballSets';
import { Compass, Sparkles, Shield, RefreshCw, Check } from 'lucide-react';

interface FormationSelectorProps {
  game: Game;
  team: Team;
  onSelectFormation: (formationId: string) => void;
  onAutoFillStarters: () => void;
  onToggleCleanGoalie: () => void;
}

export const FormationSelector: React.FC<FormationSelectorProps> = ({
  game,
  team,
  onSelectFormation,
  onAutoFillStarters,
  onToggleCleanGoalie,
}) => {
  const isBasketball = game.sport === 'basketball';
  const allFormations = [...FORMATIONS, ...BASKETBALL_FORMATIONS];
  const currentFormation = allFormations.find(f => f.id === game.formationId) || allFormations[0];
  const availableFormations = isBasketball
    ? BASKETBALL_FORMATIONS.filter(f => f.playerCount === game.formatPlayerCount)
    : getFormationsByPlayerCount(game.formatPlayerCount);

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full px-3 py-2 pb-32 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Tactics & Formations</span>
          </h2>
          <p className="text-xs text-slate-400">
            {game.formatPlayerCount}v{game.formatPlayerCount} match configuration
          </p>
        </div>

        <button
          onClick={onAutoFillStarters}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Fill Lineup</span>
        </button>
      </div>

      {/* Preferences Card: Clean Goalie Swaps & Sub Mode */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Match Preferences & Rules
        </h3>

        {/* Clean Goalie Swaps (Soccer only) */}
        {!isBasketball && (
          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/60 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Clean Goalie Swaps</div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Goalie is locked from outfield rotations (only swapped at halftime or keeper ⇄ bench)
                </p>
              </div>
            </div>

            <button
              onClick={onToggleCleanGoalie}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                game.cleanGoalieSwaps ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  game.cleanGoalieSwaps ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {/* Sub Mode Display */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <span className="font-bold text-white">Substitution Mode</span>
            <p className="text-[11px] text-slate-400">
              {game.subMode === 'free' ? 'Free rolling substitutions anytime' : 'Scheduled breaks between quarters'}
            </p>
          </div>
          <span className="font-mono text-[11px] font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">
            {game.subMode === 'free' ? 'Free Subs' : 'Quarter Subs'}
          </span>
        </div>
      </div>

      {/* Available Formations */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
          Select Formation ({availableFormations.length})
        </h3>

        {availableFormations.map(formation => {
          const isSelected = formation.id === game.formationId;

          return (
            <div
              key={formation.id}
              onClick={() => onSelectFormation(formation.id)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition active:scale-[0.99] ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white">{formation.name}</h4>
                  {isSelected && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {formation.playerCount} Players
                </span>
              </div>

              <div className="text-[11px] text-emerald-400/90 font-medium">
                Best for: {formation.recommendedFor}
              </div>

              {/* Mini tactical layout preview */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {formation.slots.map(s => (
                  <span
                    key={s.id}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      s.category === 'GK'
                        ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                        : s.category === 'DEF'
                        ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                        : s.category === 'MID'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-purple-950/60 border-purple-800 text-purple-300'
                    }`}
                  >
                    {s.role}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated bottom spacer to prevent footer navbar overlap */}
      <div className="h-28 w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
