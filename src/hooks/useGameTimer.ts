import { useEffect, useRef } from 'react';
import { Game } from '../types/soccer';

interface UseGameTimerProps {
  game: Game | null;
  onTick: (deltaSeconds: number) => void;
  onPeriodComplete?: (period: number) => void;
}

export function useGameTimer({ game, onTick, onPeriodComplete }: UseGameTimerProps) {
  const lastTimeRef = useRef<number | null>(null);
  const notifiedPeriodRef = useRef<number | null>(null);

  useEffect(() => {
    if (!game || game.status !== 'running') {
      lastTimeRef.current = null;
      return;
    }

    lastTimeRef.current = Date.now();

    const processTick = () => {
      if (lastTimeRef.current === null) return;
      const now = Date.now();
      const elapsedMs = now - lastTimeRef.current;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      if (elapsedSeconds >= 1) {
        // Advance baseline strictly by the integer seconds consumed so sub-second remainder is never lost or accelerated
        lastTimeRef.current += elapsedSeconds * 1000;
        onTick(elapsedSeconds);
      }
    };

    // Check every 250ms for responsive tick timing without any rounding errors
    const interval = setInterval(processTick, 250);

    // Sync immediately when mobile device wakes up or app returns from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processTick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      lastTimeRef.current = null;
    };
  }, [game?.status, onTick]);

  // Check period completion alert
  useEffect(() => {
    if (!game || game.status !== 'running') return;

    const periodSecondsMax = game.periodDurationMinutes * 60;
    if (game.elapsedPeriodSeconds >= periodSecondsMax && notifiedPeriodRef.current !== game.currentPeriod) {
      notifiedPeriodRef.current = game.currentPeriod;
      
      // Haptic vibration feedback
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      // Audio whistle cue
      playRefereeWhistle();

      onPeriodComplete?.(game.currentPeriod);
    }
  }, [game?.elapsedPeriodSeconds, game?.periodDurationMinutes, game?.currentPeriod, game?.status, onPeriodComplete]);
}

/**
 * Synthesizes a referee whistle double-blast using Web Audio API
 */
export function playRefereeWhistle() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    function createBlast(startTime: number, duration: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800, startTime);
      osc.frequency.exponentialRampToValueAtTime(3200, startTime + duration * 0.5);
      osc.frequency.exponentialRampToValueAtTime(2600, startTime + duration);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.linearRampToValueAtTime(0.2, startTime + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    createBlast(now, 0.18);
    createBlast(now + 0.26, 0.45);
  } catch (e) {
    // Audio may be blocked until user gesture, graceful fail
    console.debug('Whistle audio could not play:', e);
  }
}
