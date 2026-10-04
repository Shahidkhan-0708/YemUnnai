import confetti from 'canvas-confetti';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a subtle, tactile mechanical click/tap sound for button feedback.
 */
export function playTapSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // Graceful fallback if audio is blocked
  }
}

/**
 * Plays an upbeat harmonic major arpeggio chime when an order is confirmed.
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Harmonic notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);
      gain.gain.setValueAtTime(0.09, now + idx * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.28);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Fires celebratory campus confetti from both sides towards center.
 */
export function fireOrderConfetti() {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  try {
    // Left fountain
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.25, y: 0.6 },
      colors: ['#00B574', '#10B981', '#34D399', '#FBBF24', '#F06A05'],
      zIndex: 99999,
      disableForReducedMotion: true,
    });
    // Right fountain
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.75, y: 0.6 },
      colors: ['#00B574', '#10B981', '#34D399', '#FBBF24', '#F06A05'],
      zIndex: 99999,
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback
  }
}
