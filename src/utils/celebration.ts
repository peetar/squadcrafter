import confetti from 'canvas-confetti';

export function celebrateGoal() {
  try {
    // Multi-stage confetti blast
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#facc15', '#ffffff'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#3b82f6', '#facc15'],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#3b82f6', '#facc15'],
      });
    }, 250);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 150, 50, 200]);
    }
  } catch (e) {
    console.debug('Goal celebration animation skipped:', e);
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m}m`;
}

export function formatPlayerPlaytimeRatio(
  state?: { totalFieldSeconds?: number; totalBenchSeconds?: number; status?: string; periodsPlayedCount?: number; periodsPlayed?: number[] } | null,
  timeTrackingMode: 'minutes' | 'periods' = 'minutes',
  currentPeriod = 1
): string {
  if (!state) return '00/00';
  if (timeTrackingMode === 'periods') {
    const played = state.periodsPlayed ? state.periodsPlayed.length : (state.periodsPlayedCount || 0);
    const total = Math.max(1, currentPeriod);
    return `${played.toString().padStart(2, '0')}/${total.toString().padStart(2, '0')}`;
  }

  const playedMins = Math.floor((state.totalFieldSeconds || 0) / 60);
  const totalMins = Math.floor(((state.totalFieldSeconds || 0) + (state.totalBenchSeconds || 0)) / 60);
  return `${playedMins.toString().padStart(2, '0')}/${totalMins.toString().padStart(2, '0')}`;
}

export const formatPlayerMinutesRatio = formatPlayerPlaytimeRatio;

