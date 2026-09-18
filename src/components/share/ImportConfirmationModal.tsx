import React, { useState } from 'react';
import { SharePayload } from '../../utils/shareCompression';
import { Team, Game } from '../../types/soccer';
import { Download, Users, AlertCircle, CheckCircle2, ShieldCheck, Copy, ArrowRight, X } from 'lucide-react';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  payload: SharePayload | null;
  existingTeams: Team[];
  onConfirmTeam: (team: Team, mode: 'overwrite' | 'new_copy') => void;
  onConfirmBackup: (teams: Team[], savedGames?: Game[], merge?: boolean) => void;
  onClose: () => void;
}

export const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({
  isOpen,
  payload,
  existingTeams,
  onConfirmTeam,
  onConfirmBackup,
  onClose,
}) => {
  const [backupMergeMode, setBackupMergeMode] = useState<boolean>(true);
  const [teamImportMode, setTeamImportMode] = useState<'overwrite' | 'new_copy'>('overwrite');

  if (!isOpen || !payload) return null;

  const isTeam = payload.type === 'team';

  // Check if team already exists by ID or by exact name
  const existingMatchingTeam = isTeam 
    ? existingTeams.find(t => t.id === payload.team.id || t.name.toLowerCase() === payload.team.name.toLowerCase())
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white leading-tight">
                {isTeam ? 'Import Incoming Team' : 'Import Incoming Backup'}
              </h3>
              <p className="text-[11px] text-slate-400 leading-tight">
                Transfer from device or link
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isTeam ? (
            /* Single Team Preview */
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow"
                    style={{ backgroundColor: payload.team.primaryColor }}
                  >
                    ⚽
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      {payload.team.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {payload.team.players.length} players • {payload.team.defaultPlayerCount}v{payload.team.defaultPlayerCount} format
                    </p>
                  </div>
                </div>

                {/* Player Roster Preview Pill Chips */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Roster Preview:
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1 no-scrollbar">
                    {payload.team.players.map(p => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium"
                      >
                        <span className="font-bold text-emerald-400">#{p.number}</span>
                        <span>{p.name.split(' ')[0]}</span>
                        {p.canPlayGK && <span className="text-[9px] text-amber-400 font-bold">GK</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duplicate Handling */}
              {existingMatchingTeam && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Team already exists on this device</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    A team with the same name/ID already exists. Would you like to update it or save this as a separate copy?
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTeamImportMode('overwrite')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        teamImportMode === 'overwrite'
                          ? 'bg-amber-600 text-slate-950 border-amber-500 font-extrabold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Update Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamImportMode('new_copy')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                        teamImportMode === 'new_copy'
                          ? 'bg-amber-600 text-slate-950 border-amber-500 font-extrabold'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      Save as Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Full Backup Preview */
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{payload.data.teams.length} Teams in Backup</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  {payload.data.teams.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-[11px] py-0.5">
                      <span className="font-semibold text-slate-200">{t.name}</span>
                      <span className="text-slate-500">{t.players.length} players ({t.defaultPlayerCount}v{t.defaultPlayerCount})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Merge vs Replace Mode */}
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-300">Import Method:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBackupMergeMode(true)}
                    className={`p-2 rounded-xl text-left border transition ${
                      backupMergeMode 
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Merge (Safe)</div>
                    <div className="text-[10px] text-slate-400">Keep current teams and add incoming</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackupMergeMode(false)}
                    className={`p-2 rounded-xl text-left border transition ${
                      !backupMergeMode 
                        ? 'bg-red-950/60 border-red-500/80 text-red-200' 
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-xs">Replace All</div>
                    <div className="text-[10px] text-slate-400">Overwrite entire device database</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Saved securely to this device's browser storage</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (isTeam) {
                  onConfirmTeam(payload.team, teamImportMode);
                } else {
                  onConfirmBackup(payload.data.teams, payload.data.savedGames, backupMergeMode);
                }
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Import Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
