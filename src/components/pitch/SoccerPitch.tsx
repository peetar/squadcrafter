import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Formation, Game, Player } from '../../types/soccer';
import { PlayerNode } from './PlayerNode';
import { Users, Shuffle, AlertCircle, ArrowLeftRight, CheckCircle2, ArrowDownUp, FastForward, Flag, ChevronLeft, ChevronRight } from 'lucide-react';

interface SoccerPitchProps {
  game: Game;
  players: Player[];
  formation: Formation;
  onPlayerTap: (player: Player) => void;
  onOpenBenchSwap: () => void;
  onOpenAutoFill: () => void;
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

export const SoccerPitch: React.FC<SoccerPitchProps> = ({
  game,
  players,
  formation,
  onPlayerTap,
  onOpenBenchSwap,
  onOpenAutoFill,
  onQueueSub,
  onSwapPositions,
  onDirectAssignSlot,
  onAdvancePeriod,
  onEndGame,
}) => {
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<DropTarget | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'swap' | 'sub' } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  dragRef.current = dragSession;

  const showToast = (message: string, type: 'swap' | 'sub') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFeedbackToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setFeedbackToast(null);
    }, 2400);
  };

  // Get bench players
  const benchPlayers = players.filter(p => {
    const s = game.playerStates[p.id];
    return s && s.status === 'on_bench';
  });

  // Sort bench players by sitting time descending
  const sortedBench = [...benchPlayers].sort((a, b) => {
    const sA = game.playerStates[a.id]?.currentStintSeconds || 0;
    const sB = game.playerStates[b.id]?.currentStintSeconds || 0;
    return sB - sA;
  });

  // Horizontal scroll controls for bench
  const benchScrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = benchScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 4;
    setIsOverflowing(hasOverflow);
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = benchScrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, sortedBench.length]);

  const stopHoldingScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const scrollStep = (direction: 'left' | 'right', amount = 140) => {
    if (benchScrollRef.current) {
      benchScrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const startHoldingScroll = useCallback((direction: 'left' | 'right') => {
    stopHoldingScroll();
    // Immediate step on initial tap
    scrollStep(direction, 140);

    // If held for more than 220ms, begin smooth continuous auto-scroll
    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollIntervalRef.current = window.setInterval(() => {
        if (benchScrollRef.current) {
          benchScrollRef.current.scrollLeft += direction === 'left' ? -12 : 12;
        }
      }, 16);
    }, 220);
  }, [stopHoldingScroll]);

  // Ensure scroll stops if pointer is released anywhere
  useEffect(() => {
    const handleGlobalPointerUp = () => stopHoldingScroll();
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      stopHoldingScroll();
    };
  }, [stopHoldingScroll]);

  const handleArrowPointerDown = (e: React.PointerEvent, direction: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startHoldingScroll(direction);
  };

  const handleArrowPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    stopHoldingScroll();
  };

  // Check if any slot is unassigned
  const unassignedSlots = formation.slots.filter(slot => {
    return !players.some(p => {
      const s = game.playerStates[p.id];
      return s && s.status === 'on_field' && s.assignedSlotId === slot.id;
    });
  });

  // Pointer Down: starts candidate drag/tap
  const handlePointerDown = (e: React.PointerEvent, player: Player, type: 'field' | 'bench') => {
    // Only primary mouse button or single touch
    if (e.button !== 0) return;

    setDragSession({
      sourcePlayer: player,
      sourceType: type,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
    });
  };

  // Global Pointer Move & Up listeners while dragging
  useEffect(() => {
    if (!dragSession) return;

    const handlePointerMove = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;

      const dist = Math.hypot(e.clientX - current.startX, e.clientY - current.startY);
      const isDragging = current.isDragging || dist > 8;

      // Update position
      setDragSession(prev => prev ? {
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging,
      } : null);

      if (isDragging) {
        // Hit test element under pointer
        const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-drop-target]') as HTMLElement | null;
        if (el) {
          const dropType = el.dataset.dropTarget as 'field' | 'bench' | 'slot';
          const dropId = el.dataset.playerId || el.dataset.slotId || '';
          const role = el.dataset.slotRole;

          // Don't drop on self
          if (dropId !== current.sourcePlayer.id) {
            // Valid drop targets:
            // 1. field -> bench OR field -> field
            // 2. bench -> field OR bench -> slot
            if (
              (current.sourceType === 'field' && (dropType === 'bench' || dropType === 'field')) ||
              (current.sourceType === 'bench' && (dropType === 'field' || dropType === 'slot'))
            ) {
              setHoveredTarget({ type: dropType, id: dropId, role });
              return;
            }
          }
        }
        setHoveredTarget(null);
      }
    };

    const handlePointerUp = () => {
      const current = dragRef.current;
      if (!current) return;

      if (current.isDragging) {
        // Evaluate Drop action
        if (hoveredTarget) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 30, 40]);
          }

          // Case 1: Field -> Bench (Queue Sub)
          if (current.sourceType === 'field' && hoveredTarget.type === 'bench') {
            const benchPlayer = players.find(p => p.id === hoveredTarget.id);
            onQueueSub(current.sourcePlayer.id, hoveredTarget.id);
            showToast(`Sub Queued: +${benchPlayer?.name.split(' ')[0] || '#' + benchPlayer?.number} for -${current.sourcePlayer.name.split(' ')[0]}`, 'sub');
          }
          // Case 2: Bench -> Field (Queue Sub)
          else if (current.sourceType === 'bench' && hoveredTarget.type === 'field') {
            const fieldPlayer = players.find(p => p.id === hoveredTarget.id);
            onQueueSub(hoveredTarget.id, current.sourcePlayer.id);
            showToast(`Sub Queued: +${current.sourcePlayer.name.split(' ')[0]} for -${fieldPlayer?.name.split(' ')[0] || '#' + fieldPlayer?.number}`, 'sub');
          }
          // Case 3: Field -> Field (Swap Positions on Pitch)
          else if (current.sourceType === 'field' && hoveredTarget.type === 'field') {
            const targetFieldPlayer = players.find(p => p.id === hoveredTarget.id);
            onSwapPositions(current.sourcePlayer.id, hoveredTarget.id);
            showToast(`Position Swap: #${current.sourcePlayer.number} ↔ #${targetFieldPlayer?.number}`, 'swap');
          }
          // Case 4: Bench -> Empty Slot (Direct Slot Assignment)
          else if (current.sourceType === 'bench' && hoveredTarget.type === 'slot') {
            onDirectAssignSlot?.(current.sourcePlayer.id, hoveredTarget.id, hoveredTarget.role || 'SUB');
            showToast(`Assigned #${current.sourcePlayer.number} to ${hoveredTarget.role}`, 'swap');
          }
        }
      } else {
        // It was a tap/click! Trigger existing action modal
        onPlayerTap(current.sourcePlayer);
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
  }, [dragSession, hoveredTarget, onPlayerTap, onQueueSub, onSwapPositions, onDirectAssignSlot, players]);

  return (
    <div className="flex flex-col flex-1 min-h-full max-w-lg mx-auto w-full pb-28 relative touch-none">
      {/* Dynamic Feedback Toast for Drag & Drop Swaps */}
      {feedbackToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border-2 border-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-150">
          {feedbackToast.type === 'swap' ? (
            <ArrowLeftRight className="w-4 h-4 text-blue-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Pitch Quick Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <span className="text-emerald-400 font-bold">{formation.name.split(' ')[0]}</span>
          <span className="text-slate-500">•</span>
          <span>{formation.playerCount} Starters</span>
          <span className="text-slate-500">•</span>
          <span className="text-amber-400">{benchPlayers.length} Bench</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Period Advance Button */}
          {onAdvancePeriod && game.currentPeriod < game.periodsTotal && (
            <button
              onClick={onAdvancePeriod}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm transition active:scale-95 ${
                game.elapsedPeriodSeconds >= game.periodDurationMinutes * 60
                  ? 'bg-amber-500 text-slate-950 font-black animate-pulse shadow-amber-500/50'
                  : 'bg-blue-600/40 text-blue-300 border border-blue-500/50 hover:bg-blue-600/60'
              }`}
              title={`Advance to ${game.periodsTotal === 4 ? `Q${game.currentPeriod + 1}` : '2nd Half'}`}
            >
              <FastForward className="w-3 h-3 fill-current" />
              <span>{game.periodsTotal === 4 ? `Q${game.currentPeriod + 1}` : '2nd Half'}</span>
            </button>
          )}

          {/* Quick End Game Button */}
          {onEndGame && (
            <button
              onClick={() => {
                if (confirm('End match now and view fair-play summary?')) {
                  onEndGame();
                }
              }}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-red-950/80 hover:text-red-400 border border-slate-700 hover:border-red-800/80 text-slate-300 rounded-lg text-[11px] font-bold active:scale-95 transition"
              title="End Match"
            >
              <Flag className="w-3 h-3" />
              <span className="hidden sm:inline">End Match</span>
            </button>
          )}

          {unassignedSlots.length > 0 && (
            <button
              onClick={onOpenAutoFill}
              className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold active:scale-95 transition"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Fill ({unassignedSlots.length})</span>
            </button>
          )}

          <button
            onClick={onOpenBenchSwap}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-600/40 rounded-lg text-[11px] font-bold active:scale-95 transition shadow-sm"
          >
            <Shuffle className="w-3 h-3" />
            <span>Full Bench Swap</span>
          </button>
        </div>
      </div>

      {/* Main Tactical Soccer Pitch */}
      <div className="relative flex-1 min-h-[460px] sm:min-h-[520px] m-2 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-800/40 bg-emerald-800 pitch-stripes select-none">
        {/* SVG Pitch Markings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Outer Boundary Line */}
          <rect
            x="4"
            y="3"
            width="92"
            height="94"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
            rx="1"
          />

          {/* Halfway Line */}
          <line
            x1="4"
            y1="50"
            x2="96"
            y2="50"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />

          {/* Center Circle & Spot */}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />
          <circle cx="50" cy="50" r="0.9" fill="rgba(255, 255, 255, 0.9)" />

          {/* Top Penalty Box (Opponent End) */}
          <rect
            x="24"
            y="3"
            width="52"
            height="16"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />
          {/* Top 6-yard Goal Area */}
          <rect
            x="36"
            y="3"
            width="28"
            height="6"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />
          {/* Top Penalty Spot */}
          <circle cx="50" cy="12" r="0.7" fill="rgba(255, 255, 255, 0.9)" />
          {/* Top Goal Net */}
          <rect
            x="40"
            y="0.8"
            width="20"
            height="2.2"
            fill="rgba(255, 255, 255, 0.15)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="0.8"
          />

          {/* Bottom Penalty Box (Our End) */}
          <rect
            x="24"
            y="81"
            width="52"
            height="16"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />
          {/* Bottom 6-yard Goal Area */}
          <rect
            x="36"
            y="91"
            width="28"
            height="6"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />
          {/* Bottom Penalty Spot */}
          <circle cx="50" cy="88" r="0.7" fill="rgba(255, 255, 255, 0.9)" />
          {/* Bottom Penalty Arc */}
          <path
            d="M 40 81 A 10 10 0 0 1 60 81"
            fill="none"
            stroke="rgba(255, 255, 255, 0.75)"
            strokeWidth="0.8"
          />
          {/* Bottom Goal Net */}
          <rect
            x="40"
            y="97"
            width="20"
            height="2.2"
            fill="rgba(255, 255, 255, 0.15)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="0.8"
          />

          {/* Corner Arcs */}
          <path d="M 4 5 A 2 2 0 0 0 6 3" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
          <path d="M 94 3 A 2 2 0 0 0 96 5" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
          <path d="M 4 95 A 2 2 0 0 0 6 97" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
          <path d="M 94 97 A 2 2 0 0 0 96 95" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="0.8" />
        </svg>

        {/* Render Field Players for each slot */}
        {formation.slots.map(slot => {
          const player = players.find(p => {
            const s = game.playerStates[p.id];
            return s && s.status === 'on_field' && s.assignedSlotId === slot.id;
          });

          if (!player) {
            // Unassigned slot placeholder (is drop target for bench players)
            const isHovered = hoveredTarget?.type === 'slot' && hoveredTarget.id === slot.id;

            return (
              <div
                key={slot.id}
                data-drop-target="slot"
                data-slot-id={slot.id}
                data-slot-role={slot.role}
                onClick={onOpenAutoFill}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer active:scale-95 z-10 transition-all ${
                  isHovered ? 'scale-125' : ''
                }`}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              >
                <div className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-xs font-bold shadow ${
                  isHovered 
                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-300 ring-4 ring-emerald-400/80 animate-pulse' 
                    : 'border-white/60 bg-black/25 text-white/70'
                }`}>
                  +
                </div>
                <span className="text-[9px] font-bold text-white/80 bg-black/50 px-1.5 py-0.5 rounded mt-0.5">
                  {slot.role}
                </span>
              </div>
            );
          }

          const state = game.playerStates[player.id];
          const queued = game.queuedSubs.find(q => q.playerOutId === player.id);
          const incomingPlayer = queued ? players.find(p => p.id === queued.playerInId) : undefined;
          const isHovered = hoveredTarget?.type === 'field' && hoveredTarget.id === player.id;
          const isSource = dragSession?.sourcePlayer.id === player.id;

          return (
            <PlayerNode
              key={player.id}
              player={player}
              state={state}
              role={slot.role}
              x={slot.x}
              y={slot.y}
              queuedSub={queued}
              incomingPlayer={incomingPlayer}
              isHoveredTarget={isHovered}
              isDragSource={isSource}
              onTap={onPlayerTap}
              onPointerDown={(e) => handlePointerDown(e, player, 'field')}
            />
          );
        })}
      </div>

      {/* Quick Bench Bar at Bottom of Pitch View (Drag from/to bench) */}
      {sortedBench.length > 0 && (
        <div className="px-3 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold flex items-center gap-1 text-slate-300">
              <Users className="w-3.5 h-3.5" /> Bench ({sortedBench.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowDownUp className="w-3 h-3" />
              <span>Drag to field or tap to sub</span>
            </span>
          </div>

          <div className="relative flex items-center gap-1.5">
            {/* Left Scroll Arrow Button */}
            {isOverflowing && (
              <button
                type="button"
                onPointerDown={(e) => handleArrowPointerDown(e, 'left')}
                onPointerUp={handleArrowPointerUp}
                onPointerLeave={stopHoldingScroll}
                onPointerCancel={handleArrowPointerUp}
                disabled={!canScrollLeft}
                className={`h-11 w-8 flex items-center justify-center rounded-xl border select-none touch-none shrink-0 transition-all ${
                  canScrollLeft
                    ? 'bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border-slate-700 text-white shadow-md active:scale-95 cursor-pointer'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-600 opacity-40 cursor-default'
                }`}
                title="Scroll bench left (tap or hold)"
                aria-label="Scroll bench left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <div 
              ref={benchScrollRef}
              className="flex-1 min-w-0 flex gap-2 overflow-x-auto pb-1.5 bench-scrollbar"
            >
              {sortedBench.map(bp => {
                const bState = game.playerStates[bp.id];
                const sitMinutes = Math.floor((bState?.currentStintSeconds || 0) / 60);
                const isQueued = game.queuedSubs.some(q => q.playerInId === bp.id);
                const isHovered = hoveredTarget?.type === 'bench' && hoveredTarget.id === bp.id;
                const isSource = dragSession?.sourcePlayer.id === bp.id;

                return (
                  <div
                    key={bp.id}
                    data-drop-target="bench"
                    data-player-id={bp.id}
                    onPointerDown={(e) => handlePointerDown(e, bp, 'bench')}
                    className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none touch-none ${
                      isHovered
                        ? 'bg-emerald-950 border-emerald-400 text-emerald-200 ring-4 ring-emerald-400/80 scale-105 shadow-xl shadow-emerald-950/60'
                        : isSource
                        ? 'opacity-40 scale-95'
                        : isQueued 
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                        : sitMinutes >= 10
                        ? 'bg-red-950/40 border-red-800/60 text-slate-200 animate-soft-pulse'
                        : sitMinutes >= 6
                        ? 'bg-amber-950/30 border-amber-700/50 text-slate-200'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs ${
                      bp.canPlayGK 
                        ? 'bg-amber-400 text-slate-950 border-amber-300' 
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}>
                      {bp.number}
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate max-w-[80px] leading-tight">
                        {bp.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <span>{sitMinutes}m sat</span>
                        {bp.canPlayGK && <span className="text-[9px] text-amber-400 font-bold">GK</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Arrow Button */}
            {isOverflowing && (
              <button
                type="button"
                onPointerDown={(e) => handleArrowPointerDown(e, 'right')}
                onPointerUp={handleArrowPointerUp}
                onPointerLeave={stopHoldingScroll}
                onPointerCancel={handleArrowPointerUp}
                disabled={!canScrollRight}
                className={`h-11 w-8 flex items-center justify-center rounded-xl border select-none touch-none shrink-0 transition-all ${
                  canScrollRight
                    ? 'bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border-slate-700 text-white shadow-md active:scale-95 cursor-pointer'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-600 opacity-40 cursor-default'
                }`}
                title="Scroll bench right (tap or hold)"
                aria-label="Scroll bench right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Drag Avatar Following User's Finger / Cursor */}
      {dragSession?.isDragging && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center drop-shadow-2xl animate-in zoom-in-75 duration-75"
          style={{ left: dragSession.currentX, top: dragSession.currentY - 24 }}
        >
          <div className={`w-13 h-13 rounded-full flex items-center justify-center font-extrabold text-base border-2 shadow-2xl ${
            dragSession.sourcePlayer.canPlayGK
              ? 'bg-amber-400 text-slate-950 border-white ring-4 ring-amber-400/50'
              : 'bg-blue-600 text-white border-white ring-4 ring-blue-500/50'
          }`}>
            #{dragSession.sourcePlayer.number}
          </div>
          <div className="mt-1 bg-slate-950/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700 shadow flex items-center gap-1">
            <span>{dragSession.sourcePlayer.name.split(' ')[0]}</span>
            <span className="text-slate-400">({dragSession.sourceType === 'field' ? 'Field' : 'Bench'})</span>
          </div>
        </div>
      )}

      {/* Dedicated bottom spacer to prevent footer navbar overlap */}
      <div className="h-16 w-full shrink-0" aria-hidden="true" />
    </div>
  );
};
