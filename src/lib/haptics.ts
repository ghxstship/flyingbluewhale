/**
 * Haptic + audio feedback helpers for field surfaces.
 *
 * `haptic` wraps navigator.vibrate with semantic intents and silently
 * no-ops on unsupported devices (iOS Safari without web haptics).
 * `beep` plays a short WebAudio tone so a gate operator gets non-visual
 * confirmation in sunlight/noise; `scanFeedback` fires both for a scan
 * outcome. All three are gesture-adjacent (called from tap/scan handlers),
 * so the lazily-created AudioContext is allowed to start.
 */

type Pattern = "tap" | "success" | "warning" | "error";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [60, 40, 60],
};

export function haptic(pattern: Pattern) {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}

// One shared, lazily-created context — creating a context per beep leaks
// audio resources and some browsers cap the count.
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch {
    return null;
  }
}

/** Short confirmation tone. High blip = accept, low buzz = reject,
 * double mid = warning (duplicate / expired). Fails silently. */
export function beep(kind: "success" | "warning" | "error") {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime;
    const spec =
      kind === "success"
        ? [{ freq: 1175, start: 0, dur: 0.12 }]
        : kind === "warning"
          ? [
              { freq: 660, start: 0, dur: 0.09 },
              { freq: 660, start: 0.14, dur: 0.09 },
            ]
          : [{ freq: 220, start: 0, dur: 0.28 }];
    for (const s of spec) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = s.freq;
      gain.gain.setValueAtTime(0.0001, t0 + s.start);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + s.start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + s.start + s.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + s.start);
      osc.stop(t0 + s.start + s.dur + 0.02);
    }
  } catch {
    /* ignore */
  }
}

/** Combined haptic + audio cue for a scan outcome. */
export function scanFeedback(tone: "success" | "warning" | "error") {
  haptic(tone === "success" ? "success" : tone === "warning" ? "warning" : "error");
  beep(tone);
}
