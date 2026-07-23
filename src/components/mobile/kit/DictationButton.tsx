"use client";

/**
 * COMPVSS Field — dictation affordance for long text fields (T1-3,
 * MOBILE_BEST_PRACTICES_2026-07 Rank 3).
 *
 * Records with MediaRecorder (`audio/webm;codecs=opus`, falling back to
 * `audio/mp4` for iOS Safari via `isTypeSupported`), uploads the finished
 * take to `/api/v1/ai/transcribe`, and hands the transcript to the host
 * field through `onText`. The Web Speech API is deliberately NOT used —
 * it is unreliable inside WebViews, which is exactly where this PWA runs.
 *
 * Honesty rules:
 *  - the button renders NOTHING until the server confirms transcription is
 *    configured (one GET probe per page load, module-cached) — an unset
 *    key never shows a dead mic;
 *  - recording state is live (elapsed / cap, cancel, stop) and the upload
 *    state shows the real payload size;
 *  - offline says plainly that dictation needs a connection (tier 1 does
 *    not queue audio);
 *  - a mic-permission denial explains how to fix it instead of failing mute.
 */

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { KIcon } from "./icon";

export type DictationButtonProps = {
  /** Receives the finished transcript. The host decides append vs insert. */
  onText: (text: string) => void;
  /** Recording cap in seconds. Recording auto-stops (and transcribes) here. */
  maxSeconds?: number;
  disabled?: boolean;
};

const MAX_SECONDS_DEFAULT = 120;

/* One feature probe per page load, shared by every mounted button. */
let probe: Promise<boolean> | null = null;
function transcriptionEnabled(): Promise<boolean> {
  if (!probe) {
    probe = fetch("/api/v1/ai/transcribe")
      .then(async (r) => {
        if (!r.ok) return false;
        const j = (await r.json().catch(() => null)) as { data?: { enabled?: boolean } } | null;
        return Boolean(j?.data?.enabled);
      })
      .catch(() => false);
  }
  return probe;
}

/** Test-only: clear the module-level probe cache between cases. */
export function __resetDictationProbe() {
  probe = null;
}

/** Opus-in-webm first; iOS Safari's MediaRecorder only does mp4/AAC. */
function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const c of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* some WebViews throw on unknown containers — treat as unsupported */
    }
  }
  return null;
}

function fmtElapsed(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Phase = "idle" | "recording" | "uploading" | "error";

const BTN_BASE: React.CSSProperties = {
  width: 44,
  height: 44,
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid var(--p-border)",
  background: "var(--p-surface)",
  color: "var(--p-text-2)",
  cursor: "pointer",
  padding: 0,
};

export function DictationButton({ onText, maxSeconds = MAX_SECONDS_DEFAULT, disabled }: DictationButtonProps) {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [uploadSize, setUploadSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Feature-gate in an effect: SSR-safe (renders null on the server) and
  // capability-honest (needs MediaRecorder + getUserMedia + a configured
  // server key before any mic button appears).
  useEffect(() => {
    mountedRef.current = true;
    const supported =
      typeof MediaRecorder !== "undefined" && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    if (!supported) return;
    void transcriptionEnabled().then((enabled) => {
      if (mountedRef.current && enabled) setReady(true);
    });
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function teardown() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }

  function fail(message: string) {
    teardown();
    if (!mountedRef.current) return;
    setError(message);
    setPhase("error");
  }

  async function start() {
    if (disabled || phase !== "idle") return;
    setError(null);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      fail(t("m.kit.dictation.offline", undefined, "Dictation needs a connection. You can still type."));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      fail(t("m.kit.dictation.denied", undefined, "Microphone is blocked. Allow mic access for this site to dictate."));
      return;
    }
    if (!mountedRef.current) {
      stream.getTracks().forEach((tr) => tr.stop());
      return;
    }
    const mime = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((tr) => tr.stop());
      fail(t("m.kit.dictation.failed", undefined, "Couldn't transcribe that. Try again."));
      return;
    }
    streamRef.current = stream;
    recorderRef.current = rec;
    chunksRef.current = [];
    discardRef.current = false;
    rec.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const type = rec.mimeType || mime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      const wasDiscarded = discardRef.current;
      teardown();
      if (!mountedRef.current) return;
      if (wasDiscarded) {
        setPhase("idle");
        return;
      }
      void upload(blob);
    };
    elapsedRef.current = 0;
    setElapsed(0);
    setPhase("recording");
    rec.start();
    timerRef.current = setInterval(() => {
      // Side effects stay OUT of the state updater (strict mode runs
      // updaters twice) — the ref carries the authoritative count.
      elapsedRef.current += 1;
      setElapsed(Math.min(elapsedRef.current, maxSeconds));
      // Cap honestly: at the limit the take stops and transcribes — the
      // worker keeps what they said instead of losing it.
      if (elapsedRef.current >= maxSeconds) stopAndTranscribe();
    }, 1000);
  }

  function stopAndTranscribe() {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") return;
    discardRef.current = false;
    rec.stop();
  }

  function cancel() {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") {
      teardown();
      setPhase("idle");
      return;
    }
    discardRef.current = true;
    rec.stop();
  }

  async function upload(blob: Blob) {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      fail(t("m.kit.dictation.offline", undefined, "Dictation needs a connection. You can still type."));
      return;
    }
    setUploadSize(blob.size);
    setPhase("uploading");
    try {
      const res = await fetch("/api/v1/ai/transcribe", {
        method: "POST",
        headers: { "content-type": blob.type || "audio/webm" },
        body: blob,
      });
      const j = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: { text?: string }; error?: { message?: string } }
        | null;
      if (!mountedRef.current) return;
      if (!res.ok || !j?.ok) {
        fail(j?.error?.message || t("m.kit.dictation.failed", undefined, "Couldn't transcribe that. Try again."));
        return;
      }
      const text = (j.data?.text ?? "").trim();
      if (!text) {
        fail(t("m.kit.dictation.empty", undefined, "Didn't catch any speech. Try again."));
        return;
      }
      onText(text);
      setPhase("idle");
    } catch {
      if (mountedRef.current)
        fail(t("m.kit.dictation.failed", undefined, "Couldn't transcribe that. Try again."));
    }
  }

  if (!ready) return null;

  if (phase === "recording") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          role="status"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--p-mono)",
            fontSize: 12,
            color: "var(--p-text-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 8, height: 8, borderRadius: 999, background: "var(--p-danger)" }}
          />
          {t("m.kit.dictation.recording", undefined, "Recording")} {fmtElapsed(elapsed)} / {fmtElapsed(maxSeconds)}
        </span>
        <button
          type="button"
          onClick={cancel}
          aria-label={t("m.kit.dictation.cancel", undefined, "Cancel dictation")}
          style={BTN_BASE}
        >
          <KIcon name="X" size={17} />
        </button>
        <button
          type="button"
          onClick={stopAndTranscribe}
          aria-label={t("m.kit.dictation.stop", undefined, "Stop and transcribe")}
          style={{ ...BTN_BASE, background: "var(--p-accent-cta)", borderColor: "var(--p-accent-cta)", color: "var(--p-accent-cta-contrast)" }}
        >
          <KIcon name="Check" size={17} />
        </button>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <span
        role="status"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 12, color: "var(--p-text-2)" }}
      >
        <KIcon name="RefreshCw" size={15} className="motion-safe:animate-spin" />
        {t("m.kit.dictation.transcribing", { size: fmtSize(uploadSize) }, `Transcribing ${fmtSize(uploadSize)}…`)}
      </span>
    );
  }

  if (phase === "error") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44 }}>
        <span role="alert" style={{ fontSize: 12, color: "var(--p-danger)" }}>{error}</span>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setPhase("idle");
          }}
          aria-label={t("m.kit.dictation.dismiss", undefined, "Dismiss")}
          style={{ ...BTN_BASE, width: 36, height: 36 }}
        >
          <KIcon name="X" size={15} />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={disabled}
      aria-label={t("m.kit.dictation.start", undefined, "Dictate")}
      title={t("m.kit.dictation.start", undefined, "Dictate")}
      style={{ ...BTN_BASE, opacity: disabled ? 0.5 : 1 }}
    >
      <KIcon name="Mic" size={17} />
    </button>
  );
}

/**
 * Append helper for the native (uncontrolled, name-based FormData) form
 * idiom — daily log, snag, incident quick-file. Writes the transcript into
 * the textarea by id and fires an input event so any listeners see it.
 */
export function appendTranscriptToTextarea(id: string, text: string) {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (!el) return;
  el.value = el.value ? `${el.value.replace(/\s+$/, "")} ${text}` : text;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
