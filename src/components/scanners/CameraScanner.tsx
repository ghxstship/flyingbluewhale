"use client";

import * as React from "react";
import type { ReactNode } from "react";

/**
 * Reusable camera-based barcode/QR scanner primitive.
 *
 * Detection priority:
 *   1. `'BarcodeDetector' in window` — native, fastest, zero-bundle.
 *   2. Dynamic `import('@zxing/browser')` fallback for Safari/iOS.
 *   3. Renders an "unsupported" message if neither is available.
 *
 * Cleanup is airtight: media tracks stop, rAF is cancelled, and the zxing
 * reader is disposed on unmount or when detection mode flips.
 *
 * Caller handles UI around it (chrome, success log, etc) — this is a
 * thin, square video preview with a corner-frame guide overlay.
 */

// ---------------------------------------------------------------------------
// BarcodeDetector ambient typing (not in standard TS DOM lib yet).
// ---------------------------------------------------------------------------

type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e"
  | "unknown";

type DetectedBarcode = {
  rawValue: string;
  format: BarcodeFormat;
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
};

type BarcodeDetectorCtor = new (init?: { formats?: BarcodeFormat[] }) => {
  detect: (source: ImageBitmapSource | HTMLVideoElement) => Promise<DetectedBarcode[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ScannedCode = {
  /** The decoded payload. */
  value: string;
  /** Detected symbology (e.g. "qr_code", "code_128", "ean_13"). */
  format?: string;
  /** Optional bounding box from BarcodeDetector. */
  boundingBox?: DOMRectReadOnly;
};

export type CameraScannerProps = {
  /** Fired on each successful decode. Caller debounces / dedupes. */
  onScan: (code: ScannedCode) => void;
  /** Optional: restrict to specific formats. Defaults to ["qr_code", "code_128"]. */
  formats?: string[];
  /** Whether to keep scanning after a hit. Default true. */
  continuous?: boolean;
  /** Camera facing — default "environment". */
  facingMode?: "environment" | "user";
  /** Custom error renderer; defaults to a tone-warn alert. */
  renderError?: (msg: string) => ReactNode;
  /** Optional className on the wrapper. */
  className?: string;
};

type ScannerState = "initializing" | "running" | "permission-denied" | "unsupported" | "error";

type DedupeEntry = { value: string; at: number };
const DEDUPE_TTL_MS = 1500;
const DEDUPE_MAX = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CameraScanner({
  onScan,
  formats = ["qr_code", "code_128"],
  continuous = true,
  facingMode = "environment",
  renderError,
  className,
}: CameraScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const zxingControlsRef = React.useRef<{ stop: () => void } | null>(null);
  const dedupeRef = React.useRef<DedupeEntry[]>([]);
  const stoppedRef = React.useRef(false);
  const onScanRef = React.useRef(onScan);

  // Keep the latest onScan in a ref so the loop never closes over a stale callback.
  React.useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const [state, setState] = React.useState<ScannerState>("initializing");
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const [torchSupported, setTorchSupported] = React.useState(false);
  const [torchOn, setTorchOn] = React.useState(false);

  // Stable serialization of formats so the effect doesn't re-fire every render
  // when the parent passes a fresh array literal.
  const formatsKey = React.useMemo(() => formats.join(","), [formats]);

  const emitIfFresh = React.useCallback((code: ScannedCode) => {
    const now = Date.now();
    // Drop expired dedupe entries.
    dedupeRef.current = dedupeRef.current.filter((d) => now - d.at < DEDUPE_TTL_MS);
    if (dedupeRef.current.some((d) => d.value === code.value)) return;
    dedupeRef.current.push({ value: code.value, at: now });
    if (dedupeRef.current.length > DEDUPE_MAX) {
      dedupeRef.current = dedupeRef.current.slice(-DEDUPE_MAX);
    }
    try {
      onScanRef.current(code);
    } catch {
      // Caller error must not crash the scan loop.
    }
  }, []);

  React.useEffect(() => {
    stoppedRef.current = false;
    let cancelled = false;
    setState("initializing");
    setErrorMsg("");

    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            /* ignore */
          }
        });
        streamRef.current = null;
      }
    };

    const cancelLoop = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const stopZxing = () => {
      if (zxingControlsRef.current) {
        try {
          zxingControlsRef.current.stop();
        } catch {
          /* ignore */
        }
        zxingControlsRef.current = null;
      }
    };

    const cleanup = () => {
      stoppedRef.current = true;
      cancelLoop();
      stopZxing();
      stopStream();
    };

    const start = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setState("unsupported");
          setErrorMsg("Camera scanning not supported on this device");
        }
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setState("permission-denied");
          setErrorMsg("Camera permission denied");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setState("unsupported");
          setErrorMsg("No camera available on this device");
        } else {
          setState("error");
          setErrorMsg(err instanceof Error ? err.message : "Camera failed to start");
        }
        return;
      }

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      // Detect torch support (Chromium only — Safari ignores the constraint).
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.getCapabilities === "function") {
        try {
          const caps = videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
          if (caps && caps.torch === true) {
            setTorchSupported(true);
          }
        } catch {
          /* ignore */
        }
      }

      const video = videoRef.current;
      if (!video) {
        cleanup();
        return;
      }
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;
      try {
        await video.play();
      } catch {
        // Autoplay can fail on Safari without a user gesture; surface an error
        // but keep the stream alive — the user can tap to retry by remounting.
        if (!cancelled) {
          setState("error");
          setErrorMsg("Could not start preview — tap to retry");
        }
        return;
      }

      if (cancelled) {
        cleanup();
        return;
      }

      // ----- Detection path: BarcodeDetector first -----
      const Native = typeof window !== "undefined" ? window.BarcodeDetector : undefined;
      if (Native) {
        let detector: InstanceType<BarcodeDetectorCtor>;
        try {
          detector = new Native({ formats: formats as BarcodeFormat[] });
        } catch {
          // Some browsers reject unsupported formats — retry with no filter.
          try {
            detector = new Native();
          } catch {
            // Fall through to zxing.
            await startZxingFallback();
            return;
          }
        }

        if (!cancelled) setState("running");

        const tick = async () => {
          if (stoppedRef.current || cancelled) return;
          try {
            const results = await detector.detect(video);
            if (results.length > 0) {
              const r = results[0];
              emitIfFresh({ value: r.rawValue, format: r.format, boundingBox: r.boundingBox });
              if (!continuous) {
                cleanup();
                return;
              }
            }
          } catch {
            // Transient detect errors (e.g. video not ready) — keep looping.
          }
          if (!stoppedRef.current && !cancelled) {
            rafRef.current = requestAnimationFrame(() => {
              void tick();
            });
          }
        };
        rafRef.current = requestAnimationFrame(() => {
          void tick();
        });
        return;
      }

      // ----- Detection path: @zxing/browser fallback -----
      await startZxingFallback();
    };

    const startZxingFallback = async () => {
      try {
        const [browserMod, libMod] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        if (cancelled || stoppedRef.current) return;
        const reader = new browserMod.BrowserMultiFormatReader();
        const video = videoRef.current;
        if (!video) {
          cleanup();
          return;
        }

        // decodeFromStream uses our existing stream so we don't double-prompt.
        const stream = streamRef.current;
        if (!stream) return;

        const controls = await reader.decodeFromStream(stream, video, (result, _err) => {
          if (stoppedRef.current || cancelled) return;
          if (result) {
            const value = result.getText();
            // `getBarcodeFormat()` returns a numeric enum value; reverse-look it
            // up via the imported enum to ship a stable lowercase string.
            const fmtNum = result.getBarcodeFormat();
            const fmtName = libMod.BarcodeFormat[fmtNum];
            emitIfFresh({
              value,
              format: typeof fmtName === "string" ? fmtName.toLowerCase() : undefined,
            });
            if (!continuous) {
              cleanup();
            }
          }
        });
        zxingControlsRef.current = { stop: () => controls.stop() };
        if (!cancelled) setState("running");
      } catch (err) {
        if (cancelled) return;
        setState("unsupported");
        setErrorMsg(
          err instanceof Error
            ? `Camera scanning not supported on this device (${err.message})`
            : "Camera scanning not supported on this device",
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      cleanup();
    };
    // We intentionally only re-run on the explicit inputs; onScan is held in a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, continuous, formatsKey, emitIfFresh]);

  const toggleTorch = React.useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet & { torch?: boolean }],
      });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  }, [torchOn]);

  const renderDefaultError = (msg: string) => (
    <div
      role="alert"
      className="flex h-full w-full items-center justify-center rounded-lg border border-[color:var(--p-warning)]/40 bg-[color:var(--p-warning)]/10 p-4 text-center text-xs text-[color:var(--p-warning)]"
    >
      {msg}
    </div>
  );

  const showError = state === "permission-denied" || state === "unsupported" || state === "error";

  return (
    <div
      role="region"
      aria-label="Camera scanner"
      className={`relative aspect-square w-full overflow-hidden rounded-lg bg-black ${className ?? ""}`.trim()}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
        aria-hidden={showError ? "true" : undefined}
      />

      {/* Corner-frame guide — pure SVG, brutal 3px ink stroke */}
      {!showError && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <g fill="none" stroke="currentColor" strokeWidth="0.8" className="text-white">
            {/* TL */}
            <path d="M 12 22 L 12 12 L 22 12" />
            {/* TR */}
            <path d="M 78 12 L 88 12 L 88 22" />
            {/* BR */}
            <path d="M 88 78 L 88 88 L 78 88" />
            {/* BL */}
            <path d="M 22 88 L 12 88 L 12 78" />
          </g>
        </svg>
      )}

      {state === "initializing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs text-white">
          Starting Camera…
        </div>
      )}

      {showError && (
        <div className="absolute inset-0 flex items-center justify-center p-3">
          {renderError ? renderError(errorMsg) : renderDefaultError(errorMsg)}
        </div>
      )}

      {state === "running" && torchSupported && (
        <button
          type="button"
          onClick={() => void toggleTorch()}
          aria-pressed={torchOn}
          aria-label={torchOn ? "Turn torch off" : "Turn torch on"}
          className="absolute end-2 bottom-2 rounded-md border border-white/30 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-black/80"
        >
          {torchOn ? "Torch Off" : "Torch On"}
        </button>
      )}
    </div>
  );
}
