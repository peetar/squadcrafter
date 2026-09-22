import React, { useState } from 'react';
import { Team, Player } from '../../types/soccer';
import { TimeTrackingMode, ClockDirection, PLAYMAKER_ATTRIBUTES } from '../../types/sport';
import { PlayerFormModal } from '../player/PlayerFormModal';
import { Users2, Plus, Edit2, Trash2, Star, QrCode, Settings2, X, ArrowLeftRight } from 'lucide-react';

interface TeamRosterViewProps {
  activeTeam: Team;
  onSwitchTeam?: () => void;
  onUpdateTeam?: (team: Team) => void;
  onAddPlayer: (teamId: string, player: Omit<Player, 'id' | 'teamId'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (teamId: string, playerId: string) => void;
  onShareTeam?: () => void;
}

export const TeamRosterView: React.FC<TeamRosterViewProps> = ({
  activeTeam,
  onSwitchTeam,
  onUpdateTeam,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onShareTeam,
}) => {
  const [editingPlayer, setEditingPlayer] = useState<Player | null | 'new'>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Team Settings Edit State
  const [settingsTimeMode, setSettingsTimeMode] = useState<TimeTrackingMode>(activeTeam.timeTrackingMode || 'minutes');
  const [settingsClockDir, setSettingsClockDir] = useState<ClockDirection>(activeTeam.clockDirection || 'countup');
  const [settingsUseStarters, setSettingsUseStarters] = useState<boolean>(activeTeam.useStarters || false);
  const [settingsWarnPlaymakers, setSettingsWarnPlaymakers] = useState<boolean>(activeTeam.warnMissingPlaymakers ?? true);

  const isBasketball = activeTeam.sport === 'basketball';
  const startersCount = activeTeam.players.filter(p => p.isStarter).length;

  const handleSaveSettings = () => {
    if (onUpdateTeam) {
      onUpdateTeam({
        ...activeTeam,
        timeTrackingMode: settingsTimeMode,
        clockDirection: settingsClockDir,
        useStarters: settingsUseStarters,
        warnMissingPlaymakers: settingsWarnPlaymakers,
      });
    }
    setShowSettingsModal(false);
  };

  const handleSavePlayer = (playerData: Omit<Player, 'id' | 'teamId'> & { id?: string }) => {
    if (playerData.id) {
      onUpdatePlayer({
        ...playerData,
        id: playerData.id,
        teamId: activeTeam.id,
      });
    } else {
      onAddPlayer(activeTeam.id, playerData);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full px-3 py-2 pb-32 space-y-4">
      {/* Team & Roster Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-emerald-400" />
            <span>Team & Roster</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage players, starters, and playmaker attributes
          </p>
        </div>

        {onSwitchTeam && (
          <button
            onClick={onSwitchTeam}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title="Switch or manage teams"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Team</span>
          </button>
        )}
      </div>

      {/* Active Team Summary Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isBasketball ? '🏀' : '⚽'}</span>
            <h3 className="font-extrabold text-sm text-white truncate">{activeTeam.name}</h3>
            {activeTeam.useStarters && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Starters Mode
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
            <span>{activeTeam.players.length} Players</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">{startersCount} Starters</span>
            <span>•</span>
            <span>{activeTeam.defaultPlayerCount}v{activeTeam.defaultPlayerCount}</span>
            <span>•</span>
            <span className="text-slate-300">{activeTeam.timeTrackingMode === 'periods' ? 'By Periods' : 'By Minutes'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setSettingsTimeMode(activeTeam.timeTrackingMode || 'minutes');
              setSettingsClockDir(activeTeam.clockDirection || 'countup');
              setSettingsUseStarters(activeTeam.useStarters || false);
              setSettingsWarnPlaymakers(activeTeam.warnMissingPlaymakers ?? true);
              setShowSettingsModal(true);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title="Team Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {onShareTeam && (
            <button
              onClick={onShareTeam}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-xl border border-slate-700 transition"
              title="Transfer Team (QR / Link)"
            >
              <QrCode className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setEditingPlayer('new')}
            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Roster ({activeTeam.players.length})</span>
          <span className="text-[11px] text-slate-500">Tap ⭐ to set Starter</span>
        </div>

        {activeTeam.players.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
            <h4 className="text-sm font-bold text-slate-200">No players added yet</h4>
            <p className="text-xs text-slate-400 mt-1">Tap 'Add Player' above to build your roster.</p>
          </div>
        ) : (
          activeTeam.players.map(p => (
            <div
              key={p.id}
              className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-2.5 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* 1-Tap Starter Toggle Button */}
                <button
                  onClick={() => onUpdatePlayer({ ...p, isStarter: !p.isStarter })}
                  className={`p-1 rounded-lg border transition active:scale-90 ${
                    p.isStarter 
                      ? 'bg-amber-400/20 text-amber-400 border-amber-400/50 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                  title={p.isStarter ? 'Designated Starter (tap to remove)' : 'Tap to mark as Starter'}
                >
                  <Star className={`w-4 h-4 ${p.isStarter ? 'fill-current text-amber-400' : ''}`} />
                </button>

                {/* Jersey Token */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shadow shrink-0 ${
                  p.canPlayGK ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'
                }`}>
                  {p.number}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white truncate">
                    <span className="truncate">{p.name}</span>
                    {p.canPlayGK && (
                      <span className="text-[9px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/40 px-1 py-0.2 rounded shrink-0">
                        GK
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>Pos: {p.preferredPositions.join(', ')}</span>
                    {p.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate max-w-[100px] text-slate-500">{p.notes}</span>
                      </>
                    )}
                  </div>

                  {/* Playmaker Attribute Badges */}
                  {p.playmakerAttributes && p.playmakerAttributes.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-1">
                      {p.playmakerAttributes.map(attr => {
                        const meta = PLAYMAKER_ATTRIBUTES[attr];
                        return (
                          <span
                            key={attr}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-0.5"
                          >
                            <span>{meta?.icon}</span>
                            <span>{meta?.label || attr}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit & Delete Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setEditingPlayer(p)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-95"
                  title="Edit player & coach skill rating"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Remove ${p.name} from the team?`)) {
                      onDeletePlayer(activeTeam.id, p.id);
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition active:scale-95"
                  title="Delete player"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}

        <div className="h-28 w-full shrink-0" aria-hidden="true" />
      </div>

      {/* Edit/Add Player Modal */}
      {editingPlayer && (
        <PlayerFormModal
          player={editingPlayer === 'new' ? null : editingPlayer}
          teamId={activeTeam.id}
          sport={activeTeam.sport || 'soccer'}
          onClose={() => setEditingPlayer(null)}
          onSave={handleSavePlayer}
        />
      )}

      {/* Team Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <span>Team Settings</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Playtime Tracking */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Playtime Tracking Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsTimeMode('minutes')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    settingsTimeMode === 'minutes' ? 'bg-blue-600 border-blue-400 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Minutes (e.g. 14/25m)
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTimeMode('periods')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    settingsTimeMode === 'periods' ? 'bg-blue-600 border-blue-400 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Periods (e.g. 01/01)
                </button>
              </div>
            </div>

            {/* Clock Direction */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Clock Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsClockDir('countup')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    settingsClockDir === 'countup' ? 'bg-blue-600 border-blue-400 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Count Up (00:00)
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsClockDir('countdown')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    settingsClockDir === 'countdown' ? 'bg-blue-600 border-blue-400 text-white shadow' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Count Down
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200">⭐ Use Starters?</span>
                  <p className="text-[10px] text-slate-400">Force designated starters for period 1 lineup</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsUseStarters(!settingsUseStarters)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settingsUseStarters ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${settingsUseStarters ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <span className="font-bold text-slate-200">⚠️ Missing Playmaker Warnings</span>
                  <p className="text-[10px] text-slate-400">Alert if missing stoppers, scorers, or shooters</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsWarnPlaymakers(!settingsWarnPlaymakers)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                    settingsWarnPlaymakers ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${settingsWarnPlaymakers ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow active:scale-95 transition"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
