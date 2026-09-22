import React, { useState, useEffect } from 'react';
import { Team, SubstitutionMode } from '../../types/soccer';
import { FORMATIONS, getFormationsByPlayerCount } from '../../data/formations';
import { BASKETBALL_FORMATIONS } from '../../data/basketballSets';
import { X, Play, Shield, Compass, Clock, Check } from 'lucide-react';

interface NewGameModalProps {
  teams: Team[];
  activeTeam: Team;
  onClose: () => void;
  onCreateGame: (
    teamId: string,
    opponentName: string,
    formatPlayerCount: number,
    formationId: string,
    subMode: SubstitutionMode,
    cleanGoalieSwaps: boolean,
    periodsTotal: number,
    periodDurationMinutes: number
  ) => void;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  teams,
  activeTeam,
  onClose,
  onCreateGame,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(activeTeam.id);
  const [opponentName, setOpponentName] = useState('');

  const currentTeam = teams.find(t => t.id === selectedTeamId) || activeTeam;
  const isBasketball = currentTeam.sport === 'basketball';

  const [playerCount, setPlayerCount] = useState<number>(currentTeam.defaultPlayerCount || (isBasketball ? 5 : 7));

  const availableFormations = isBasketball
    ? BASKETBALL_FORMATIONS.filter(f => f.playerCount === playerCount)
    : getFormationsByPlayerCount(playerCount);

  const [selectedFormationId, setSelectedFormationId] = useState<string>(
    availableFormations[0]?.id || (isBasketball ? 'bb-5out' : '7v7-2-3-1')
  );

  const [subMode, setSubMode] = useState<SubstitutionMode>(isBasketball ? 'quarters' : 'free');
  const [cleanGoalieSwaps, setCleanGoalieSwaps] = useState<boolean>(!isBasketball);

  // Match Periods (2 halves vs 4 quarters)
  const [matchStructure, setMatchStructure] = useState<'halves' | 'quarters'>(isBasketball ? 'quarters' : 'halves');
  const [periodDuration, setPeriodDuration] = useState<number>(isBasketball ? 8 : 25);

  // Update defaults if selected team changes
  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const t = teams.find(team => team.id === teamId) || activeTeam;
    const isBb = t.sport === 'basketball';
    const count = t.defaultPlayerCount || (isBb ? 5 : 7);
    setPlayerCount(count);

    if (isBb) {
      const bFormations = BASKETBALL_FORMATIONS.filter(f => f.playerCount === count);
      setSelectedFormationId(bFormations[0]?.id || 'bb-5out');
      setMatchStructure('quarters');
      setPeriodDuration(8);
      setCleanGoalieSwaps(false);
      setSubMode('quarters');
    } else {
      const sFormations = getFormationsByPlayerCount(count);
      setSelectedFormationId(sFormations[0]?.id || '7v7-2-3-1');
      setMatchStructure('halves');
      setPeriodDuration(25);
      setCleanGoalieSwaps(true);
      setSubMode('free');
    }
  };

  useEffect(() => {
    handleTeamChange(activeTeam.id);
  }, [activeTeam.id]);

  const handleStructureChange = (structure: 'halves' | 'quarters') => {
    setMatchStructure(structure);
    if (structure === 'halves') {
      setPeriodDuration(isBasketball ? 16 : 25);
    } else {
      setPeriodDuration(isBasketball ? 8 : 12);
      setSubMode('quarters');
    }
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const formations = isBasketball
      ? BASKETBALL_FORMATIONS.filter(f => f.playerCount === count)
      : getFormationsByPlayerCount(count);
    if (formations.length > 0) {
      setSelectedFormationId(formations[0].id);
    }
  };

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame(
      selectedTeamId,
      opponentName.trim() || 'Opponent',
      playerCount,
      selectedFormationId,
      subMode,
      cleanGoalieSwaps,
      matchStructure === 'quarters' ? 4 : 2,
      periodDuration
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-white">Create New Match</h3>
            <p className="text-xs text-slate-400">Configure lineup, rules, and timers</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleStartGame} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Team and Opponent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Our Team</label>
              <select
                value={selectedTeamId}
                onChange={e => handleTeamChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.players.length} players)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Opponent</label>
              <input
                type="text"
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                placeholder="e.g. Red Dragons"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Number of Players on Field / Court */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Number of Players on {isBasketball ? 'Court' : 'Field'} (Match Format)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {playerCount}v{playerCount}
              </span>
            </div>
            <div className={`grid ${isBasketball ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
              {isBasketball ? (
                [5, 3].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handlePlayerCountChange(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      playerCount === cnt
                        ? 'bg-amber-600 border-amber-400 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cnt}v{cnt} {cnt === 5 ? '(Full Court)' : '(Half Court / 3v3)'}
                  </button>
                ))
              ) : (
                <>
                  {[7, 9, 11].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handlePlayerCountChange(cnt)}
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
                    onClick={() => handlePlayerCountChange(5)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      playerCount === 5
                        ? 'bg-blue-600 border-blue-400 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    5v5
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Lineup Formations */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Suggested {isBasketball ? 'Sets & Formations' : 'Formations'} ({playerCount}v{playerCount})
            </label>
            <div className="space-y-2">
              {availableFormations.map(f => {
                const isSelected = f.id === selectedFormationId;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFormationId(f.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? isBasketball ? 'bg-slate-800 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{f.name}</span>
                      {isSelected && <Check className={`w-3.5 h-3.5 ${isBasketball ? 'text-amber-400' : 'text-emerald-400'}`} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Substitution Mode & Clean Goalie Swaps */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold text-slate-300">
              Substitution & Rotation Rules
            </label>

            {/* Free Subs vs Quarter Subs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSubMode('free')}
                className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                  subMode === 'free'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Free Subs</div>
                <div className="text-[10px] font-normal text-slate-400">Rolling subs anytime during play</div>
              </button>

              <button
                type="button"
                onClick={() => setSubMode('quarters')}
                className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                  subMode === 'quarters'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-bold">Quarter Subs</div>
                <div className="text-[10px] font-normal text-slate-400">Sub rotations at period breaks</div>
              </button>
            </div>

            {/* Clean Goalie Swaps Preference (Soccer only) */}
            {!isBasketball && (
              <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Clean Goalie Swaps</div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      Only swap keeper at halftime or direct 1-to-1 bench swap
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCleanGoalieSwaps(!cleanGoalieSwaps)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    cleanGoalieSwaps ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      cleanGoalieSwaps ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Match Structure & Duration */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Structure</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStructureChange('halves')}
                  className={`py-1.5 text-xs font-bold rounded-lg border ${
                    matchStructure === 'halves'
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  2 Halves
                </button>
                <button
                  type="button"
                  onClick={() => handleStructureChange('quarters')}
                  className={`py-1.5 text-xs font-bold rounded-lg border ${
                    matchStructure === 'quarters'
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  4 Quarters
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Period Minutes</label>
              <input
                type="number"
                min="5"
                max="45"
                value={periodDuration}
                onChange={e => setPeriodDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* Start Match Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Create Match & Auto-Fill Starters</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
