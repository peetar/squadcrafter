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

    const interval = setInterval(() => {
      const now = Date.now();
      if (lastTimeRef.current !== null) {
        const diffSeconds = Math.round((now - lastTimeRef.current) / 1000);
        if (diffSeconds >= 1) {
          onTick(diffSeconds);
          lastTimeRef.current = now;
        }
      } else {
        lastTimeRef.current = now;
      }
    }, 500);

    return () => {
      clearInterval(interval);
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
