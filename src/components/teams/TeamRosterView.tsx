import React, { useState } from 'react';
import { Team, Player } from '../../types/soccer';
import { PlayerFormModal } from '../player/PlayerFormModal';
import { Users2, Plus, Edit2, Trash2, Shield, PlusCircle, ChevronDown, Check, QrCode } from 'lucide-react';

interface TeamRosterViewProps {
  teams: Team[];
  activeTeam: Team;
  onSelectTeam: (teamId: string) => void;
  onAddTeam: (name: string, defaultCount: number) => Team;
  onAddPlayer: (teamId: string, player: Omit<Player, 'id' | 'teamId'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (teamId: string, playerId: string) => void;
  onShareTeam?: () => void;
}

export const TeamRosterView: React.FC<TeamRosterViewProps> = ({
  teams,
  activeTeam,
  onSelectTeam,
  onAddTeam,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onShareTeam,
}) => {
  const [editingPlayer, setEditingPlayer] = useState<Player | null | 'new'>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCount, setNewTeamCount] = useState<number>(7);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const created = onAddTeam(newTeamName.trim(), newTeamCount);
    setShowAddTeamModal(false);
    setNewTeamName('');
    onSelectTeam(created.id);
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
      {/* Team Selection Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-emerald-400" />
            <span>Team & Roster</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage players, formations, and coach ratings
          </p>
        </div>

        <button
          onClick={() => setShowAddTeamModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 rounded-xl border border-slate-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Team</span>
        </button>
      </div>

      {/* Team Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {teams.map(t => {
          const isActive = t.id === activeTeam.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTeam(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{t.name}</span>
              <span className="text-[10px] font-mono opacity-80">({t.defaultPlayerCount}v{t.defaultPlayerCount})</span>
            </button>
          );
        })}
      </div>

      {/* Active Team Summary Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-white">{activeTeam.name}</h3>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span>{activeTeam.players.length} Players</span>
            <span>•</span>
            <span>Format: {activeTeam.defaultPlayerCount} on field</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onShareTeam && (
            <button
              onClick={onShareTeam}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition"
              title="Transfer this team to phone (QR Code / Link)"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Transfer to Phone</span>
            </button>
          )}

          <button
            onClick={() => setEditingPlayer('new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
          <span>Roster Members</span>
          <span className="text-[11px] text-slate-500">Tap edit to view coach skill rating</span>
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
              className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shadow ${
                  p.canPlayGK ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'
                }`}>
                  {p.number}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-bold text-sm text-white truncate">
                    <span className="truncate">{p.name}</span>
                    {p.canPlayGK && (
                      <span className="text-[9px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/40 px-1 py-0.2 rounded">
                        GK
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>Pos: {p.preferredPositions.join(', ')}</span>
                    {p.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate max-w-[120px] text-slate-500">{p.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit & Delete actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingPlayer(p)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition active:scale-95"
                  title="Edit player & view coach skill rating"
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

        {/* Dedicated bottom spacer to prevent fixed footer navigation from covering last team member */}
        <div className="h-28 w-full shrink-0" aria-hidden="true" />
      </div>

      {/* Edit/Add Player Modal */}
      {editingPlayer && (
        <PlayerFormModal
          player={editingPlayer === 'new' ? null : editingPlayer}
          teamId={activeTeam.id}
          onClose={() => setEditingPlayer(null)}
          onSave={handleSavePlayer}
        />
      )}

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-base text-white mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. Thunderbolts U11"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Number of Players on Field for Games *
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[7, 9, 11].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setNewTeamCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        newTeamCount === cnt
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cnt}v{cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewTeamCount(5)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      newTeamCount === 5
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    5v5
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Custom count:</span>
                  <input
                    type="number"
                    min="3"
                    max="11"
                    value={newTeamCount}
                    onChange={e => setNewTeamCount(Number(e.target.value))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono text-center"
                  />
                  <span className="text-[11px] text-slate-500">(flexible for tournaments)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
