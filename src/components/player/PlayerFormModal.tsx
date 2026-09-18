import React, { useState } from 'react';
import { Player, PositionCategory } from '../../types/soccer';
import { X, ShieldAlert, Check, User, Hash, Star } from 'lucide-react';

interface PlayerFormModalProps {
  player?: Player | null;
  teamId: string;
  onClose: () => void;
  onSave: (playerData: Omit<Player, 'id' | 'teamId'> & { id?: string }) => void;
}

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  player,
  teamId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(player?.name || '');
  const [number, setNumber] = useState<number | ''>(player?.number ?? 10);
  const [skillLevel, setSkillLevel] = useState<number>(player?.skillLevel ?? 7);
  const [preferredPositions, setPreferredPositions] = useState<PositionCategory[]>(
    player?.preferredPositions || ['MID']
  );
  const [canPlayGK, setCanPlayGK] = useState<boolean>(player?.canPlayGK ?? false);
  const [notes, setNotes] = useState(player?.notes || '');

  const togglePosition = (pos: PositionCategory) => {
    if (preferredPositions.includes(pos)) {
      if (preferredPositions.length > 1) {
        setPreferredPositions(preferredPositions.filter(p => p !== pos));
      }
    } else {
      setPreferredPositions([...preferredPositions, pos]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: player?.id,
      name: name.trim(),
      number: Number(number) || 0,
      skillLevel,
      preferredPositions,
      canPlayGK: canPlayGK || preferredPositions.includes('GK'),
      notes: notes.trim(),
    });
    onClose();
  };

  const categories: PositionCategory[] = ['GK', 'DEF', 'MID', 'FWD'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <h3 className="font-extrabold text-base text-white">
            {player ? 'Edit Player' : 'Add New Player'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name and Jersey # */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Player Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Liam Smith"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Jersey # *
              </label>
              <input
                type="number"
                min="0"
                max="99"
                required
                value={number}
                onChange={e => setNumber(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 text-center"
              />
            </div>
          </div>

          {/* Coach Skill Rating (1-10) - Strictly Hidden Everywhere Else! */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-current" />
                Coach Skill Rating (1 - 10)
              </label>
              <span className="text-sm font-black font-mono bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                {skillLevel} / 10
              </span>
            </div>

            {/* Privacy Alert Banner */}
            <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-900/60 rounded-xl p-2 text-[11px] text-amber-300/90 leading-tight">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Coach Privacy:</strong> This rating is strictly private and is only visible here on this edit screen. It is never displayed on pitch or game screens so players will not see it.
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={skillLevel}
              onChange={e => setSkillLevel(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 (Beginner)</span>
              <span>5 (Developing)</span>
              <span>10 (Advanced)</span>
            </div>
          </div>

          {/* Preferred Positions */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Preferred Positions (Select 1 or more)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => {
                const isSelected = preferredPositions.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => togglePosition(cat)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plays Goalie Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white">Can Play Goalkeeper?</span>
              <p className="text-[11px] text-slate-400">
                Eligible for GK position during lineup generation
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCanPlayGK(!canPlayGK)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                canPlayGK || preferredPositions.includes('GK') ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  canPlayGK || preferredPositions.includes('GK') ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Coach Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Strong left foot, wants to try striker"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{player ? 'Save Changes' : 'Add Player to Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
