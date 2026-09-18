import React, { useState } from 'react';
import { Team } from '../../types/soccer';
import { 
  Users2, 
  Plus, 
  Trash2, 
  Play, 
  ArrowRight, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Award, 
  QrCode, 
  Share2,
  Smartphone,
  DownloadCloud,
  Sparkles
} from 'lucide-react';

interface TeamSelectionScreenProps {
  teams: Team[];
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: (name: string, defaultPlayerCount: number, primaryColor?: string) => Team;
  onDeleteTeam: (teamId: string) => void;
  onRestoreSampleData: () => void;
  onShareTeam?: (team: Team) => void;
  onShareBackup?: () => void;
  onOpenManualImport?: () => void;
  activeGameTeamId?: string | null;
  isPwaInstalled?: boolean;
  onOpenPwaInstructions?: () => void;
  deferredPrompt?: any;
  onNativeInstallPrompt?: () => void;
}

export const TeamSelectionScreen: React.FC<TeamSelectionScreenProps> = ({
  teams,
  onSelectTeam,
  onCreateTeam,
  onDeleteTeam,
  onRestoreSampleData,
  onShareTeam,
  onShareBackup,
  onOpenManualImport,
  activeGameTeamId,
  isPwaInstalled = false,
  onOpenPwaInstructions,
  deferredPrompt,
  onNativeInstallPrompt,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [playerCount, setPlayerCount] = useState<number>(7);
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [importedMessage, setImportedMessage] = useState<string | null>(null);

  const colors = [
    { label: 'Royal Blue', hex: '#2563eb' },
    { label: 'Crimson Red', hex: '#dc2626' },
    { label: 'Emerald Green', hex: '#059669' },
    { label: 'Amber Gold', hex: '#d97706' },
    { label: 'Purple', hex: '#7c3aed' },
    { label: 'Slate Dark', hex: '#334155' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    const created = onCreateTeam(teamName.trim(), playerCount, selectedColor);
    setShowCreateModal(false);
    setTeamName('');
    onSelectTeam(created.id);
  };

  // Export LocalStorage data as JSON file
  const handleExportData = () => {
    try {
      const data = localStorage.getItem('squadcrafter_app_state_v1') || '{}';
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `squadcrafter-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e);
    }
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.teams && Array.isArray(parsed.teams)) {
          localStorage.setItem('squadcrafter_app_state_v1', text);
          window.location.reload();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse JSON backup file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full px-4 py-6 space-y-6 pb-32">
      {/* Hero Welcome Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl mx-auto shadow-xl shadow-emerald-950/40">
          ⚽
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          SquadCrafter
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Choose an existing team or create a new one to manage tactical formations, playing time, and live substitutions.
        </p>

        {/* Local Storage Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-[11px] font-semibold text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Saved to Browser Local Storage • 100% Offline Ready</span>
        </div>
      </div>

      {/* Primary Action: Create Team Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Create New Team</span>
      </button>

      {/* Existing Teams List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
          <span>Your Teams ({teams.length})</span>
          <span>Select to Manage</span>
        </div>

        {teams.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-3">
            <Users2 className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No teams created yet</div>
            <p className="text-xs text-slate-500">
              Create your first team or restore the default sample teams to explore the app.
            </p>
            <button
              onClick={onRestoreSampleData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 rounded-xl border border-slate-700 transition"
            >
              Load Sample Youth Teams
            </button>
          </div>
        ) : (
          teams.map(team => {
            const hasActiveGame = activeGameTeamId === team.id;

            return (
              <div
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className="group relative p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-3xl cursor-pointer transition shadow-lg flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                {/* Left: Avatar & Team Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md flex-shrink-0"
                    style={{ backgroundColor: team.primaryColor || '#2563eb' }}
                  >
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white truncate group-hover:text-emerald-400 transition-colors">
                        {team.name}
                      </h3>
                      {hasActiveGame && (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-red-950 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full animate-pulse">
                          <Play className="w-2.5 h-2.5 fill-current" /> Live Game
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-slate-300">
                        {team.defaultPlayerCount}v{team.defaultPlayerCount} Format
                      </span>
                      <span>•</span>
                      <span>{team.players.length} Players</span>
                    </div>
                  </div>
                </div>

                {/* Right: Enter Button, Share, & Delete */}
                <div className="flex items-center gap-1.5">
                  {onShareTeam && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareTeam(team);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition"
                      title="Transfer Team to Phone (QR / Link)"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTeam(team.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-300 font-extrabold text-xs rounded-xl transition shadow"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${team.name}" and its roster?`)) {
                        onDeleteTeam(team.id);
                      }
                    }}
                    className="p-2 text-slate-600 hover:text-red-400 rounded-xl transition"
                    title="Delete Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Local Storage & Backup Management Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Local Storage & Device Transfer</span>
        </div>

        <p className="text-slate-400 leading-relaxed text-[11px]">
          All teams, player skill levels, formations, and match stats are stored persistently in your browser's local store. Transfer easily between desktop and phone using a QR code, link, or JSON backup file.
        </p>

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {onShareBackup && (
            <button
              onClick={onShareBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold rounded-xl border border-emerald-500/40 active:scale-95 transition"
              title="Transfer all teams to another device via QR code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Transfer to Phone (QR)</span>
            </button>
          )}

          {onOpenManualImport && (
            <button
              onClick={onOpenManualImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 active:scale-95 transition"
              title="Paste a share link or transfer code"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Paste Share Code</span>
            </button>
          )}

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export File</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 cursor-pointer active:scale-95 transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Import File</span>
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('Restore sample youth teams (Lightning FC & Firestorm)?')) {
                onRestoreSampleData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-300 font-medium rounded-xl border border-slate-800 active:scale-95 transition ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* PWA App Install Banner (only shown if not already running as installed standalone PWA) */}
      {!isPwaInstalled && onOpenPwaInstructions && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-purple-950/80 border border-blue-500/40 rounded-3xl p-4 shadow-xl shadow-blue-950/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xl shadow-lg flex-shrink-0">
                📲
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white tracking-tight">Install App on Phone</span>
                  <span className="text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                    PWA Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Run full screen without browser bars &amp; manage subs offline at the field with no cell service.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <button
              onClick={onOpenPwaInstructions}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Smartphone className="w-4 h-4 text-blue-200" />
              <span>PWA Install Instructions</span>
            </button>

            {deferredPrompt && onNativeInstallPrompt && (
              <button
                onClick={onNativeInstallPrompt}
                className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition flex-shrink-0"
                title="1-Tap Native Install"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>1-Tap</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
          <div 
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-base text-white mb-4">Create New Team</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g. Thunderbolts U10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Player Count on Field (Flexible) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Game Format (Players on Field) *
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[7, 9, 11].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPlayerCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        playerCount === cnt
                          ? 'bg-blue-600 border-blue-400 text-white shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cnt}v{cnt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPlayerCount(5)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      playerCount === 5
                        ? 'bg-blue-600 border-blue-400 text-white shadow'
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
                    value={playerCount}
                    onChange={e => setPlayerCount(Number(e.target.value))}
                    className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono text-center"
                  />
                  <span className="text-[11px] text-slate-500">(flexible for tournaments)</span>
                </div>
              </div>

              {/* Team Primary Color */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Team Jersey Color
                </label>
                <div className="flex items-center gap-2">
                  {colors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-8 h-8 rounded-xl transition-transform ${
                        selectedColor === c.hex ? 'scale-115 ring-2 ring-white shadow-lg' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
