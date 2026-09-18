import React from 'react';
import { Game, Team } from '../../types/soccer';
import { useFullscreen } from '../../hooks/useFullscreen';
import { Maximize2, Minimize2, Shield, Play, Pause, Volume2, ArrowLeftRight, FastForward, Flag } from 'lucide-react';
import { formatTime } from '../../utils/celebration';
import { playRefereeWhistle } from '../../hooks/useGameTimer';

interface HeaderProps {
  game: Game | null;
  team: Team | null;
  onSetGameStatus: (status: 'running' | 'paused') => void;
  onRegisterGoal: (playerId: string, isUs: boolean) => void;
  onRegisterOpponentGoal: () => void;
  onToggleCleanGoalie: () => void;
  onNewGameClick: () => void;
  onSwitchTeam?: () => void;
  onAdvancePeriod?: () => void;
  onEndGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  game,
  team,
  onSetGameStatus,
  onRegisterOpponentGoal,
  onToggleCleanGoalie,
  onNewGameClick,
  onSwitchTeam,
  onAdvancePeriod,
  onEndGame,
}) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const isRunning = game?.status === 'running';

  const periodLabel = game 
    ? (game.periodsTotal === 4 ? `Q${game.currentPeriod}` : (game.currentPeriod === 1 ? '1st Half' : '2nd Half'))
    : 'No Game Active';

  const nextPeriodName = game 
    ? (game.periodsTotal === 4 ? `Q${game.currentPeriod + 1}` : '2nd Half')
    : '';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 py-2 text-white">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-5xl mx-auto">
        {/* Brand & Team Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow flex-shrink-0">
            ⚽
          </div>
          
          {team ? (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white leading-tight truncate max-w-[90px] sm:max-w-[150px]">
                  {team.name}
                </h1>
                {onSwitchTeam && (
                  <button
                    onClick={onSwitchTeam}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 bg-slate-800/80 hover:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 active:scale-95 transition"
                    title="Switch to another team or create team"
                  >
                    <ArrowLeftRight className="w-2.5 h-2.5" />
                    <span className="hidden sm:inline">Teams</span>
                  </button>
                )}
                {game && (
                  <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    {game.formatPlayerCount}v{game.formatPlayerCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight truncate">
                {game ? `vs ${game.opponentName}` : `${team.players.length} players • ${team.defaultPlayerCount}v${team.defaultPlayerCount}`}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                SquadCrafter
              </h1>
              <p className="text-[10px] text-slate-400 leading-tight">
                Team Management Hub
              </p>
            </div>
          )}
        </div>

        {/* Live Match Center (If Game is Active) */}
        {game && team ? (
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/80 px-2 py-1.5 rounded-xl border border-slate-800">
            {/* Play/Pause Button */}
            <button
              onClick={() => onSetGameStatus(isRunning ? 'paused' : 'running')}
              className={`p-1.5 rounded-lg font-bold flex items-center justify-center transition active:scale-95 ${
                isRunning 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-900/40'
              }`}
              title={isRunning ? 'Pause Game Clock' : 'Start Game Clock'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />}
            </button>

            {/* Scoreboard */}
            <div className="flex items-center gap-1 px-1 font-mono text-sm sm:text-base font-extrabold tracking-tight">
              <span className="text-emerald-400">{game.scoreUs}</span>
              <span className="text-slate-600">-</span>
              <button 
                onClick={onRegisterOpponentGoal}
                title="Tap to add opponent goal"
                className="text-slate-300 hover:text-red-400 active:scale-90 transition"
              >
                {game.scoreThem}
              </button>
            </div>

            {/* Clock & Period */}
            <div className="border-l border-slate-800 pl-1.5 sm:pl-2 text-right">
              <div className="font-mono text-xs font-bold text-slate-100 flex items-center justify-end gap-1">
                {formatTime(game.elapsedPeriodSeconds)}
                {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />}
              </div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                {periodLabel}
              </div>
            </div>

            {/* Advance Period & End Game Controls directly in Header */}
            <div className="border-l border-slate-800 pl-1.5 sm:pl-2 flex items-center gap-1">
              {game.currentPeriod < game.periodsTotal && onAdvancePeriod ? (
                <button
                  onClick={onAdvancePeriod}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-[10px] sm:text-xs rounded-lg shadow flex items-center gap-1 transition"
                  title={`Advance to ${nextPeriodName}`}
                >
                  <FastForward className="w-3 h-3 fill-current" />
                  <span>{nextPeriodName}</span>
                </button>
              ) : null}

              {onEndGame && (
                <button
                  onClick={() => {
                    if (confirm('End match now and view the fair-play playing time summary?')) {
                      onEndGame();
                    }
                  }}
                  className="px-1.5 sm:px-2 py-1 bg-slate-800 hover:bg-red-950/80 hover:text-red-400 border border-slate-700 hover:border-red-800/80 text-slate-300 active:scale-95 font-bold text-[10px] sm:text-xs rounded-lg transition flex items-center gap-1"
                  title="End Match"
                >
                  <Flag className="w-3 h-3" />
                  <span className="hidden sm:inline">End</span>
                </button>
              )}
            </div>
          </div>
        ) : team ? (
          <button
            onClick={onNewGameClick}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition"
          >
            + New Game
          </button>
        ) : null}

        {/* Quick Utilities: Clean Goalie toggle & Fullscreen */}
        <div className="flex items-center gap-1">
          {game && team && (
            <button
              onClick={onToggleCleanGoalie}
              className={`p-1.5 rounded-lg text-xs font-medium border transition ${
                game.cleanGoalieSwaps 
                  ? 'bg-blue-950/60 text-blue-400 border-blue-800/80 hover:bg-blue-900/60' 
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700/60 line-through'
              }`}
              title={game.cleanGoalieSwaps ? 'Clean Goalie Swaps: ON (Goalie locked from outfield mass rotation)' : 'Clean Goalie Swaps: OFF'}
            >
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={playRefereeWhistle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 active:scale-95 transition"
            title="Blow Whistle Sound"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 active:scale-95 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Pitch Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
