import React, { useState, useRef, useEffect } from 'react';
import { Formation, Game, Player } from '../../types/soccer';
import { PlayerNode } from '../pitch/PlayerNode';
import { formatPlayerPlaytimeRatio } from '../../utils/celebration';
import { validateLineupBalance } from '../../services/balanceValidator';
import { Users, AlertTriangle, ArrowLeftRight, CheckCircle2, ArrowDownUp } from 'lucide-react';

interface BasketballCourtProps {
  game: Game;
  players: Player[];
  formation: Formation;
  onPlayerTap: (player: Player) => void;
  onOpenBenchSwap: () => void;
  onOpenAutoFill?: () => void;
  onQueueSub: (playerOutId: string, playerInId: string, targetSlotId?: string) => void;
  onSwapPositions: (player1Id: string, player2Id: string) => void;
  onDirectAssignSlot?: (playerId: string, slotId: string, role: string) => void;
  onAdvancePeriod?: () => void;
  onEndGame?: () => void;
}

interface DragSession {
  sourcePlayer: Player;
  sourceType: 'field' | 'bench';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
}

interface DropTarget {
  type: 'field' | 'bench' | 'slot';
  id: string;
  role?: string;
}

export const BasketballCourt: React.FC<BasketballCourtProps> = ({
  game,
  players,
  formation,
  onPlayerTap,
  onOpenBenchSwap,
  onQueueSub,
  onSwapPositions,
  onDirectAssignSlot,
}) => {
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<DropTarget | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'swap' | 'sub' } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const targetRef = useRef<DropTarget | null>(null);

  dragRef.current = dragSession;
  targetRef.current = hoveredTarget;

  const showToast = (message: string, type: 'swap' | 'sub') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFeedbackToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  // Check Lineup Balance Warnings
  const balanceWarnings = validateLineupBalance(
    'basketball',
    players,
    formation,
    game.playerStates,
    game.warnMissingPlaymakers ?? true
  );

  // Group players by status
  const courtPlayers = players.filter(p => game.playerStates[p.id]?.status === 'on_field');
  const benchPlayers = players
    .filter(p => game.playerStates[p.id]?.status === 'on_bench')
    .sort((a, b) => {
      const stintA = game.playerStates[a.id]?.currentStintSeconds || 0;
      const stintB = game.playerStates[b.id]?.currentStintSeconds || 0;
      return stintB - stintA;
    });

  // Drag & drop pointer handlers
  const handlePointerDown = (player: Player, sourceType: 'field' | 'bench', e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-drag]')) return;

    e.preventDefault();
    setDragSession({
      sourcePlayer: player,
      sourceType,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
    });
  };

  useEffect(() => {
    if (!dragSession) return;

    const handlePointerMove = (e: PointerEvent) => {
      const session = dragRef.current;
      if (!session) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isDragging = session.isDragging || dist > 8;

      setDragSession(prev => prev ? {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging,
      } : null);

      if (isDragging) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        let foundTarget: DropTarget | null = null;

        for (const el of elements) {
          const dropField = el.closest('[data-drop-target="field"]');
          if (dropField) {
            const targetPlayerId = dropField.getAttribute('data-player-id');
            if (targetPlayerId && targetPlayerId !== session.sourcePlayer.id) {
              foundTarget = { type: 'field', id: targetPlayerId };
              break;
            }
          }

          const dropBench = el.closest('[data-drop-target="bench"]');
          if (dropBench) {
            const targetPlayerId = dropBench.getAttribute('data-player-id');
            if (session.sourceType === 'field') {
              foundTarget = { type: 'bench', id: targetPlayerId || 'bench' };
              break;
            }
          }

          const dropSlot = el.closest('[data-drop-target="slot"]');
          if (dropSlot && session.sourceType === 'bench') {
            const slotId = dropSlot.getAttribute('data-slot-id');
            if (slotId) {
              foundTarget = { type: 'slot', id: slotId };
              break;
            }
          }
        }

        setHoveredTarget(foundTarget);
      }
    };

    const handlePointerUp = () => {
      const session = dragRef.current;
      const target = targetRef.current;
      if (!session) return;

      if (!session.isDragging) {
        onPlayerTap(session.sourcePlayer);
      } else if (target) {
        if (session.sourceType === 'bench' && target.type === 'field') {
          const fieldPlayer = players.find(p => p.id === target.id);
          if (fieldPlayer) {
            onQueueSub(fieldPlayer.id, session.sourcePlayer.id);
            showToast(`Queued #${session.sourcePlayer.number} to sub in for #${fieldPlayer.number}`, 'sub');
          }
        } else if (session.sourceType === 'field' && target.type === 'bench') {
          const targetBenchPlayer = players.find(p => p.id === target.id);
          if (targetBenchPlayer) {
            onQueueSub(session.sourcePlayer.id, targetBenchPlayer.id);
            showToast(`Queued #${targetBenchPlayer.number} for #${session.sourcePlayer.number}`, 'sub');
          } else if (benchPlayers.length > 0) {
            const longestSitting = benchPlayers[0];
            onQueueSub(session.sourcePlayer.id, longestSitting.id);
            showToast(`Queued #${longestSitting.number} for #${session.sourcePlayer.number}`, 'sub');
          }
        } else if (session.sourceType === 'field' && target.type === 'field') {
          const targetPlayer = players.find(p => p.id === target.id);
          if (targetPlayer) {
            onSwapPositions(session.sourcePlayer.id, targetPlayer.id);
            showToast(`Swapped #${session.sourcePlayer.number} ↔ #${targetPlayer.number}`, 'swap');
          }
        } else if (session.sourceType === 'bench' && target.type === 'slot') {
          onDirectAssignSlot?.(session.sourcePlayer.id, target.id, 'SUB');
          showToast(`Assigned #${session.sourcePlayer.number} to slot`, 'swap');
        }
      }

      setDragSession(null);
      setHoveredTarget(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragSession, onPlayerTap, onQueueSub, onSwapPositions, onDirectAssignSlot, players, benchPlayers]);

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full pb-28 relative touch-none select-none">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-slate-700 shadow-xl flex items-center gap-2">
            {feedbackToast.type === 'swap' ? (
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
        </div>
      )}

      {/* Lineup Balance Warnings Banner */}
      {balanceWarnings.length > 0 && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-3 py-1.5 text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 z-10 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">{balanceWarnings.map(w => w.message).join(' • ')}</span>
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono shrink-0 hidden sm:inline">
            Tap player to sub
          </span>
        </div>
      )}

      {/* Court Quick Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs shrink-0">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <span className="text-amber-400 font-bold">{formation.name}</span>
          <span className="text-slate-500">•</span>
          <span>{players.length} on Court</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">{benchPlayers.length} Bench</span>
        </div>

        <div className="flex items-center gap-1.5">
          {benchPlayers.length > 0 && (
            <button
              onClick={onOpenBenchSwap}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 shadow-sm transition"
              title="Mass Bench Rotation"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mass Sub</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Court Canvas Area */}
      <div className="relative flex-1 w-full max-w-lg mx-auto flex items-center justify-center p-2">
        <div 
          className="relative w-full h-full max-h-[580px] rounded-2xl overflow-hidden border-4 border-amber-950/80 shadow-2xl bg-amber-950/20"
          style={{
            background: 'linear-gradient(180deg, #78350f 0%, #92400e 45%, #b45309 80%, #78350f 100%)',
          }}
        >
          {/* Hardwood Court SVG Markings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Subtle wood floor slats */}
            <line x1="10" y1="0" x2="10" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="20" y1="0" x2="20" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="30" y1="0" x2="30" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="40" y1="0" x2="40" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="60" y1="0" x2="60" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="70" y1="0" x2="70" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="80" y1="0" x2="80" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            <line x1="90" y1="0" x2="90" y2="100" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />

            {/* Boundary Line */}
            <rect x="3" y="3" width="94" height="94" fill="none" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" rx="2" />

            {/* Half-Court Line & Center Circle (at bottom) */}
            <line x1="3" y1="88" x2="97" y2="88" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />
            <path d="M 40 88 A 10 10 0 0 1 60 88" fill="none" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />

            {/* 3-Point Arc (radius from hoop at x:50, y:15) */}
            {/* Straight sideline corners */}
            <line x1="12" y1="3" x2="12" y2="24" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />
            <line x1="88" y1="3" x2="88" y2="24" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />
            {/* Arc joining corners */}
            <path d="M 12 24 C 12 56, 88 56, 88 24" fill="none" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />

            {/* Key / Paint (Lane) */}
            <rect x="34" y="3" width="32" height="38" fill="rgba(120, 53, 15, 0.35)" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />

            {/* Free Throw Circle (dashed top half, solid bottom half) */}
            <circle cx="50" cy="41" r="10" fill="none" stroke="#fef08a" strokeWidth="1.2" strokeOpacity="0.85" />

            {/* Restricted Area Arc */}
            <path d="M 45 13 A 5 5 0 0 0 55 13" fill="none" stroke="#fef08a" strokeWidth="1" strokeOpacity="0.8" />

            {/* Backboard */}
            <line x1="42" y1="9" x2="58" y2="9" stroke="#ffffff" strokeWidth="2" />

            {/* Rim & Hoop */}
            <line x1="50" y1="9" x2="50" y2="12" stroke="#ea580c" strokeWidth="1.5" />
            <circle cx="50" cy="14" r="2.8" fill="none" stroke="#ea580c" strokeWidth="1.6" />
          </svg>

          {/* Render Active Court Players by Formation Slots */}
          {formation.slots.map(slot => {
            const player = courtPlayers.find(p => game.playerStates[p.id]?.assignedSlotId === slot.id);
            const isTarget = hoveredTarget?.type === 'field' && hoveredTarget?.id === player?.id;

            if (!player) {
              return (
                <div
                  key={slot.id}
                  data-drop-target="slot"
                  data-slot-id={slot.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-2 border-dashed border-amber-300/40 bg-amber-950/40 flex items-center justify-center text-[10px] text-amber-200/80 font-bold"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  {slot.role}
                </div>
              );
            }

            const state = game.playerStates[player.id];
            const queuedSub = game.queuedSubs.find(q => q.playerOutId === player.id);
            const incomingPlayer = queuedSub ? players.find(p => p.id === queuedSub.playerInId) : undefined;
            const isDragSource = dragSession?.sourcePlayer.id === player.id;

            return (
              <PlayerNode
                key={player.id}
                player={player}
                state={state}
                role={slot.role}
                x={slot.x}
                y={slot.y}
                timeTrackingMode={game.timeTrackingMode}
                currentPeriod={game.currentPeriod}
                queuedSub={queuedSub}
                incomingPlayer={incomingPlayer}
                isHoveredTarget={isTarget}
                isDragSource={isDragSource}
                onTap={onPlayerTap}
                onPointerDown={(e) => handlePointerDown(player, 'field', e)}
              />
            );
          })}
        </div>
      </div>

      {/* Bench Tray Section */}
      <div 
        data-drop-target="bench"
        className="w-full max-w-lg mx-auto px-3 pt-1"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold flex items-center gap-1 text-slate-300">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Bench ({benchPlayers.length})</span>
          </span>
          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
            <ArrowDownUp className="w-3 h-3" />
            <span>Drag to court or tap to sub</span>
          </span>
        </div>

        {benchPlayers.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-2 px-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
            All players on court
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 select-none no-scrollbar">
            {benchPlayers.map(player => {
              const state = game.playerStates[player.id];
              const isQueuedIn = game.queuedSubs.some(q => q.playerInId === player.id);
              const isDragSource = dragSession?.sourcePlayer.id === player.id;
              const isTarget = hoveredTarget?.type === 'bench' && hoveredTarget.id === player.id;

              return (
                <div
                  key={player.id}
                  data-drop-target="bench"
                  data-player-id={player.id}
                  onPointerDown={(e) => handlePointerDown(player, 'bench', e)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition shrink-0 ${
                    isTarget
                      ? 'bg-amber-950 border-amber-400 text-amber-200 ring-2 ring-amber-400/80 scale-105 shadow-xl'
                      : isQueuedIn
                      ? 'border-amber-500/80 bg-amber-950/40 text-amber-300'
                      : 'border-slate-800 bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:border-slate-700'
                  } ${isDragSource ? 'opacity-40 scale-95' : ''}`}
                >
                  <span className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-white font-extrabold text-xs flex items-center justify-center">
                    {player.number}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold truncate max-w-[80px]">{player.name.split(' ')[0]}</span>
                      {player.isStarter && <span className="text-[10px]" title="Starter">⭐</span>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatPlayerPlaytimeRatio(state, game.timeTrackingMode, game.currentPeriod)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dedicated bottom spacer to prevent footer navbar overlap on desktop & mobile */}
      <div className="h-24 w-full shrink-0" aria-hidden="true" />

      {/* Active Drag Preview Ghost */}
      {dragSession && dragSession.isDragging && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: dragSession.currentX, top: dragSession.currentY }}
        >
          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-2xl border-2 border-white animate-pulse">
            #{dragSession.sourcePlayer.number}
          </div>
        </div>
      )}
    </div>
  );
};
