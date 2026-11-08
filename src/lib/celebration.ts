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

/**
 * High-priority repeating kitchen chime for merchant order alert.
 * Emulates high-speed restaurant POS terminals (Swiggy Partner / Zomato OS chime).
 */
export function playKitchenOrderAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    
    // Alert pattern: 2 rapid high-pitch bell bursts
    const bursts = [0, 0.22];
    bursts.forEach((offset) => {
      // Dual frequencies for acoustic penetration in noisy kitchen (880Hz + 1320Hz)
      const freqs = [880, 1320];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
      });
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Bright, cheerful acoustic notification for student when food is marked ready at counter.
 */
export function playFoodReadyChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [659.25, 880.0, 1174.66]; // E5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.12, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.32);
    });
  } catch {
    // Graceful fallback
  }
}

