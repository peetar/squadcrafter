import React, { useState, useEffect } from 'react';
import { useSoccerStore } from './store/useSoccerStore';
import { useGameTimer } from './hooks/useGameTimer';
import { Header } from './components/layout/Header';
import { Navigation, ActiveTab } from './components/layout/Navigation';
import { SoccerPitch } from './components/pitch/SoccerPitch';
import { BenchTray } from './components/bench/BenchTray';
import { FormationSelector } from './components/pitch/FormationSelector';
import { TeamRosterView } from './components/teams/TeamRosterView';
import { TeamSelectionScreen } from './components/teams/TeamSelectionScreen';
import { GameStatsSummary } from './components/game/GameStatsSummary';
import { QueuedSubsBar } from './components/subs/QueuedSubsBar';
import { PlayerActionSheet } from './components/player/PlayerActionSheet';
import { SingleSubModal } from './components/subs/SingleSubModal';
import { FullBenchSwapModal } from './components/subs/FullBenchSwapModal';
import { NewGameModal } from './components/game/NewGameModal';
import { ShareTransferModal } from './components/share/ShareTransferModal';
import { ImportConfirmationModal } from './components/share/ImportConfirmationModal';
import { ManualImportModal } from './components/share/ManualImportModal';
import { MatchRecapModal } from './components/game/MatchRecapModal';
import { extractPayloadFromInput, SharePayload } from './utils/shareCompression';
import { FORMATIONS } from './data/formations';
import { Player, Team, Game, PositionCategory, TacticalOverrideType } from './types/soccer';
import { Plus, Play, Sparkles, Trophy, Users, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export function App() {
  const store = useSoccerStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('pitch');

  // Modals state
  const [actionSheetPlayer, setActionSheetPlayer] = useState<Player | null>(null);
  const [singleSubTarget, setSingleSubTarget] = useState<Player | null>(null);
  const [showFullBenchSwap, setShowFullBenchSwap] = useState<boolean>(false);
  const [showNewGameModal, setShowNewGameModal] = useState<boolean>(false);
  const [selectedRecapGame, setSelectedRecapGame] = useState<Game | null>(null);
  const [isNewlyFinished, setIsNewlyFinished] = useState<boolean>(false);

  const handleEndGame = () => {
    if (!store.activeGame) return;
    const finishedGame = { ...store.activeGame, status: 'finished' as const };
    store.endGame();
    setSelectedRecapGame(finishedGame);
    setIsNewlyFinished(true);
  };

  // Transfer & Share modals state
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [incomingPayload, setIncomingPayload] = useState<SharePayload | null>(null);
  const [showManualImport, setShowManualImport] = useState<boolean>(false);
  const [transferToast, setTransferToast] = useState<string | null>(null);

  // Detect incoming transfer URL from hash (#import=...) or query (?import=...)
  useEffect(() => {
    const checkForImport = () => {
      const fullUrl = window.location.href;
      const extracted = extractPayloadFromInput(fullUrl);
      if (extracted) {
        setIncomingPayload(extracted);
        // Clean hash without refreshing page
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    checkForImport();
    window.addEventListener('hashchange', checkForImport);
    return () => window.removeEventListener('hashchange', checkForImport);
  }, []);

  const handleConfirmTeam = (team: Team, mode: 'overwrite' | 'new_copy') => {
    store.importTeam(team, mode);
    setIncomingPayload(null);
    setTransferToast(`Successfully imported "${team.name}"!`);
    setTimeout(() => setTransferToast(null), 3500);
  };

  const handleConfirmBackup = (teams: Team[], savedGames?: Game[], merge?: boolean) => {
    store.importBackupData(teams, savedGames || [], merge ?? true);
    setIncomingPayload(null);
    setTransferToast(`Successfully imported backup with ${teams.length} teams!`);
    setTimeout(() => setTransferToast(null), 3500);
  };

  // Common Transfer Modals across both landing screen and active game
  const renderSharedTransferModals = () => (
    <>
      <ShareTransferModal
        isOpen={Boolean(sharePayload)}
        onClose={() => setSharePayload(null)}
        payload={sharePayload}
      />

      <ImportConfirmationModal
        isOpen={Boolean(incomingPayload)}
        payload={incomingPayload}
        existingTeams={store.teams}
        onConfirmTeam={handleConfirmTeam}
        onConfirmBackup={handleConfirmBackup}
        onClose={() => setIncomingPayload(null)}
      />

      <ManualImportModal
        isOpen={showManualImport}
        onClose={() => setShowManualImport(false)}
        onPayloadExtracted={(payload) => setIncomingPayload(payload)}
      />

      {transferToast && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{transferToast}</span>
        </div>
      )}
    </>
  );

  // Hook up game clock timer
  useGameTimer({
    game: store.activeGame,
    onTick: store.tickTimer,
    onPeriodComplete: (period) => {
      console.log(`Period ${period} completed`);
    },
  });

  const activeFormation = store.activeGame 
    ? (FORMATIONS.find(f => f.id === store.activeGame?.formationId) || FORMATIONS[0])
    : FORMATIONS[0];

  const currentRoster = store.activeTeam?.players || [];
  
  // Count bench players
  const benchCount = store.activeGame 
    ? currentRoster.filter(p => store.activeGame?.playerStates[p.id]?.status === 'on_bench').length
    : 0;

  // Handle player tap from Pitch or Bench
  const handlePlayerTap = (player: Player) => {
    setActionSheetPlayer(player);
  };

  // Handle suggestion trigger for a player
  const handleSuggestSub = (player: Player) => {
    setActionSheetPlayer(null);
    setSingleSubTarget(player);
  };

  // Handle tactical overrides
  const handleSetOverride = (playerId: string, type: TacticalOverrideType, category?: PositionCategory) => {
    if (type === 'NONE' || !category) {
      store.setTacticalOverride(playerId, undefined);
    } else {
      store.setTacticalOverride(playerId, { type, targetCategory: category });
    }
  };

  // =========================================================================
  // 1. FIRST SCREEN: Team Management (Choose or Create a Team)
  // =========================================================================
  if (!store.activeTeam) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-100 select-none">
        {/* Simplified Header on landing page */}
        <Header
          game={null}
          team={null}
          onSetGameStatus={() => {}}
          onRegisterGoal={() => {}}
          onRegisterOpponentGoal={() => {}}
          onToggleCleanGoalie={() => {}}
          onNewGameClick={() => {}}
        />

        <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          <TeamSelectionScreen
            teams={store.teams}
            onSelectTeam={(teamId) => {
              store.setActiveTeamId(teamId);
              setActiveTab('pitch');
            }}
            onCreateTeam={store.addTeam}
            onDeleteTeam={store.deleteTeam}
            onRestoreSampleData={store.restoreSampleData}
            onShareTeam={(team) => setSharePayload({ type: 'team', version: 1, team })}
            onShareBackup={() => setSharePayload({ type: 'backup', version: 1, data: { teams: store.teams, savedGames: store.savedGames } })}
            onOpenManualImport={() => setShowManualImport(true)}
            activeGameTeamId={store.activeGame?.teamId}
          />
        </main>

        {renderSharedTransferModals()}
      </div>
    );
  }

  // =========================================================================
  // 2. ACTIVE TEAM WORKSPACE (Pitch, Bench, Tactics, Roster, Stats)
  // =========================================================================
  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-950 text-slate-100 select-none">
      {/* App Header with Switch Team button and Live Match Controls */}
      <Header
        game={store.activeGame}
        team={store.activeTeam}
        onSetGameStatus={store.setGameStatus}
        onRegisterGoal={store.registerGoal}
        onRegisterOpponentGoal={store.registerOpponentGoal}
        onAdjustScore={store.adjustScore}
        onToggleCleanGoalie={store.toggleCleanGoalieSwaps}
        onNewGameClick={() => setShowNewGameModal(true)}
        onSwitchTeam={() => store.setActiveTeamId(null)}
        onAdvancePeriod={store.advancePeriod}
        onEndGame={handleEndGame}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {/* If no game is active, show Quick Start Match Hero if on Pitch/Bench/Tactics */}
        {!store.activeGame && (activeTab === 'pitch' || activeTab === 'bench' || activeTab === 'tactics') ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-xl">
              ⚽
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400 mb-2">
                <span>Managing:</span>
                <span className="text-white font-bold">{store.activeTeam.name}</span>
                <button
                  onClick={() => store.setActiveTeamId(null)}
                  className="text-emerald-400 hover:text-emerald-300 ml-1 underline font-semibold"
                >
                  Change
                </button>
              </div>

              <h2 className="text-xl font-black text-white tracking-tight">
                Ready for Matchday?
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Start a game to begin tracking playing time, field formations, and smart bench rotations.
              </p>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setShowNewGameModal(true)}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Create New Game for {store.activeTeam.name}</span>
            </button>

            {/* Quick features checklist */}
            <div className="w-full bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Auto-fill starters for {store.activeTeam.defaultPlayerCount}v{store.activeTeam.defaultPlayerCount} format</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Live bench sitting timers & fair-play balancing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Queue single subs & 1-tap Full Bench Swaps</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Private coach skill ratings (hidden from players)</span>
              </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <button
                onClick={() => setActiveTab('roster')}
                className="hover:text-white flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Roster ({currentRoster.length})</span>
              </button>

              <span>•</span>

              <button
                onClick={() => store.setActiveTeamId(null)}
                className="hover:text-white flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Switch Team</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab 1: Pitch View */}
            {activeTab === 'pitch' && store.activeGame && (
              <SoccerPitch
                game={store.activeGame}
                players={currentRoster}
                formation={activeFormation}
                onPlayerTap={handlePlayerTap}
                onOpenBenchSwap={() => setShowFullBenchSwap(true)}
                onOpenAutoFill={store.autoFillStartersAction}
                onQueueSub={store.queueSub}
                onSwapPositions={store.swapFieldPositions}
                onDirectAssignSlot={store.assignBenchPlayerToSlot}
                onAdvancePeriod={store.advancePeriod}
                onEndGame={handleEndGame}
              />
            )}

            {/* Tab 2: Bench Tray */}
            {activeTab === 'bench' && store.activeGame && (
              <BenchTray
                game={store.activeGame}
                players={currentRoster}
                formation={activeFormation}
                onPlayerTap={handlePlayerTap}
                onOpenBenchSwap={() => setShowFullBenchSwap(true)}
                onDirectSubTrigger={handleSuggestSub}
                onAdvancePeriod={store.advancePeriod}
                onEndGame={handleEndGame}
              />
            )}

            {/* Tab 3: Tactics & Formations */}
            {activeTab === 'tactics' && store.activeGame && (
              <FormationSelector
                game={store.activeGame}
                team={store.activeTeam}
                onSelectFormation={store.changeFormation}
                onAutoFillStarters={store.autoFillStartersAction}
                onToggleCleanGoalie={store.toggleCleanGoalieSwaps}
              />
            )}

            {/* Tab 4: Team & Roster (Skill levels editable ONLY here) */}
            {activeTab === 'roster' && (
              <TeamRosterView
                teams={store.teams}
                activeTeam={store.activeTeam}
                onSelectTeam={store.setActiveTeamId}
                onAddTeam={store.addTeam}
                onAddPlayer={store.addPlayer}
                onUpdatePlayer={store.updatePlayer}
                onDeletePlayer={store.deletePlayer}
                onShareTeam={() => setSharePayload({ type: 'team', version: 1, team: store.activeTeam! })}
              />
            )}

            {/* Tab 5: Fair Play & Stats & Match History */}
            {activeTab === 'stats' && store.activeTeam && (
              <GameStatsSummary
                game={store.activeGame}
                team={store.activeTeam}
                players={currentRoster}
                savedGames={store.savedGames}
                onAdvancePeriod={store.advancePeriod}
                onEndGame={handleEndGame}
                onSelectPastGame={(pastGame) => {
                  setSelectedRecapGame(pastGame);
                  setIsNewlyFinished(false);
                }}
                onDeleteSavedGame={store.deleteSavedGame}
                onRegisterOpponentGoal={store.registerOpponentGoal}
                onAdjustScore={store.adjustScore}
              />
            )}
          </>
        )}
      </main>

      {/* Queued Substitutions Floating Bar */}
      {store.activeGame && (
        <QueuedSubsBar
          game={store.activeGame}
          players={currentRoster}
          formation={activeFormation}
          onConfirmSubs={store.confirmQueuedSubs}
          onCancelSub={store.cancelQueuedSub}
          onClearAll={store.clearQueuedSubs}
        />
      )}

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        benchCount={benchCount}
        queuedSubCount={store.activeGame?.queuedSubs.length || 0}
      />

      {/* Player Action Sheet (Tap on player on pitch/bench) */}
      {actionSheetPlayer && store.activeGame && (
        <PlayerActionSheet
          player={actionSheetPlayer}
          state={store.activeGame.playerStates[actionSheetPlayer.id]}
          onClose={() => setActionSheetPlayer(null)}
          onRegisterGoal={(pId) => store.registerGoal(pId, true)}
          onToggleTired={store.togglePlayerTired}
          onSuggestSub={handleSuggestSub}
          onSetOverride={handleSetOverride}
        />
      )}

      {/* Single Sub Modal */}
      {singleSubTarget && store.activeGame && (
        <SingleSubModal
          player={singleSubTarget}
          game={store.activeGame}
          players={currentRoster}
          formation={activeFormation}
          onClose={() => setSingleSubTarget(null)}
          onQueueSub={store.queueSub}
          onDirectSwap={store.directSwap}
        />
      )}

      {/* Full Bench Swap Modal */}
      {showFullBenchSwap && store.activeGame && (
        <FullBenchSwapModal
          game={store.activeGame}
          players={currentRoster}
          formation={activeFormation}
          onClose={() => setShowFullBenchSwap(false)}
          onQueueMultiple={store.queueMultipleSubs}
          onConfirmMultipleNow={(subs) => {
            store.queueMultipleSubs(subs);
            store.confirmQueuedSubs();
          }}
        />
      )}

      {/* Create New Game Modal */}
      {showNewGameModal && store.activeTeam && (
        <NewGameModal
          teams={store.teams}
          activeTeam={store.activeTeam}
          onClose={() => setShowNewGameModal(false)}
          onCreateGame={(teamId, opp, count, formId, subMode, cleanGk, periods, dur) => {
            store.setActiveTeamId(teamId);
            store.createNewGame(teamId, opp, count, formId, subMode, cleanGk, periods, dur);
            setActiveTab('pitch');
          }}
        />
      )}

      {/* Post-Game Match Recap Modal */}
      {selectedRecapGame && (
        <MatchRecapModal
          isOpen={Boolean(selectedRecapGame)}
          game={selectedRecapGame}
          team={store.teams.find(t => t.id === selectedRecapGame.teamId) || store.activeTeam}
          players={store.teams.find(t => t.id === selectedRecapGame.teamId)?.players || currentRoster}
          isNewlyFinished={isNewlyFinished}
          onClose={() => {
            setSelectedRecapGame(null);
            setIsNewlyFinished(false);
          }}
        />
      )}

      {renderSharedTransferModals()}
    </div>
  );
}

export default App;
