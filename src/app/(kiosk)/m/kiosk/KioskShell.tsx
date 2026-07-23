"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraScanner } from "@/components/scanners/CameraScanner";
import { formatsForMode } from "@/lib/scan/formats";
import { getPosition } from "@/lib/geo/position";
import { haptic } from "@/lib/haptics";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";
import { postFieldWrite } from "@/lib/offline/outbox";

/**
 * T1-4 kiosk shell — the full-screen shared-tablet punch surface.
 *
 * Flow: big clock + PIN pad (or pass-QR scan) → server identify → confirm
 * card (name / role / current state) → punch. The PIN or scanned code is held
 * ONLY in component memory and is re-sent with the punch so the server
 * re-resolves identity per write (the client never handles a user id). A 30s
 * idle timer resets to the entry screen; nothing about a worker persists
 * between punches.
 *
 * Offline: identify needs the network (an identity confirmation the server
 * didn't do would be theater), but the punch endpoint is queueable — when
 * identify can't reach the server the shell offers a direct queued punch that
 * the service worker replays, with identity resolved at replay time.
 */

const IDLE_RESET_MS = 30_000;
const DONE_RESET_MS = 5_000;

type WorkerCard = { name: string; role: string; avatarUrl: string | null };

type Stage =
  | { kind: "entry" }
  | { kind: "identifying" }
  | { kind: "confirm"; method: "pin" | "code"; secret: string; worker: WorkerCard; clockedIn: boolean; onBreak: boolean }
  | { kind: "offline"; method: "pin" | "code"; secret: string }
  | { kind: "override"; method: "pin" | "code"; secret: string; message: string }
  | { kind: "done"; message: string; queued: boolean };

type PunchAction = "clock_in" | "clock_out" | "break_start" | "break_end";

type PunchData = {
  action: PunchAction;
  workerName?: string;
  zoneName?: string | null;
  enforcementState?: string;
};

/** Live wall clock — seeded in an effect so SSR/hydration never disagree. */
function useWallClock(): string {
  const fmt = useFormatters();
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(fmt.time(new Date(), { seconds: true }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fmt]);
  return now;
}

export function KioskShell({
  deviceLabel,
  orgName,
  projectName,
}: {
  deviceLabel: string;
  orgName: string;
  projectName: string | null;
}) {
  const t = useT();
  const clock = useWallClock();
  const [stage, setStage] = useState<Stage>({ kind: "entry" });
  const [mode, setMode] = useState<"pin" | "scan">("pin");
  const [pin, setPin] = useState("");
  const [entryError, setEntryError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [overrideText, setOverrideText] = useState("");

  // ----- idle reset: every interaction re-arms; firing wipes all state -----
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = useCallback(() => {
    setStage({ kind: "entry" });
    setPin("");
    setEntryError(null);
    setPending(false);
    setOverrideText("");
  }, []);
  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(reset, IDLE_RESET_MS);
  }, [reset]);
  useEffect(() => {
    armIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [armIdle]);

  // Success screens hand back to the next worker on their own.
  useEffect(() => {
    if (stage.kind !== "done") return;
    const id = setTimeout(reset, DONE_RESET_MS);
    return () => clearTimeout(id);
  }, [stage, reset]);

  // ----- step 1: identify ---------------------------------------------------
  const identify = useCallback(
    async (method: "pin" | "code", secret: string) => {
      armIdle();
      setPending(true);
      setEntryError(null);
      try {
        const res = await fetch("/api/v1/kiosk/identify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method, secret }),
        });
        const payload = (await res.json().catch(() => null)) as {
          ok?: boolean;
          data?: { worker: WorkerCard; clockedIn: boolean; onBreak: boolean };
          error?: { message?: string; details?: { retryAfterS?: number | null } };
        } | null;
        if (payload?.ok && payload.data) {
          haptic("success");
          setStage({
            kind: "confirm",
            method,
            secret,
            worker: payload.data.worker,
            clockedIn: payload.data.clockedIn,
            onBreak: payload.data.onBreak,
          });
          setPin("");
          return;
        }
        haptic("error");
        const retryS = payload?.error?.details?.retryAfterS;
        setEntryError(
          typeof retryS === "number" && retryS > 0
            ? t("m.kiosk.lockedFor", { seconds: String(retryS) }, "PIN entry is locked. Try again in {seconds}s.")
            : (payload?.error?.message ?? t("m.kiosk.notRecognized", undefined, "Not recognized. Try again.")),
        );
        setPin("");
      } catch {
        // Network down — identity can't be confirmed, but time can still be
        // recorded: the punch endpoint queues offline and resolves at replay.
        setStage({ kind: "offline", method, secret });
        setPin("");
      } finally {
        setPending(false);
      }
    },
    [armIdle, t],
  );

  // ----- step 2: punch ------------------------------------------------------
  const punch = useCallback(
    async (method: "pin" | "code", secret: string, action: PunchAction, overrideReason?: string) => {
      armIdle();
      if (pending) return;
      setPending(true);
      try {
        const at = new Date().toISOString();
        const pos = await getPosition();
        const res = await postFieldWrite<PunchData>("/api/v1/kiosk/punch", {
          method,
          secret,
          action,
          at,
          ...(pos ? { lat: pos.lat, lng: pos.lng } : {}),
          ...(pos?.accuracy != null ? { accuracy: pos.accuracy } : {}),
          ...(overrideReason ? { overrideReason } : {}),
        });
        if (res.status === "ok") {
          haptic("success");
          const done =
            res.data.action === "clock_in"
              ? t("m.kiosk.doneIn", { name: res.data.workerName ?? "" }, "Clocked in. Have a good shift, {name}.")
              : res.data.action === "clock_out"
                ? t("m.kiosk.doneOut", { name: res.data.workerName ?? "" }, "Clocked out. See you next time, {name}.")
                : res.data.action === "break_start"
                  ? t("m.kiosk.doneBreakStart", undefined, "Break started.")
                  : t("m.kiosk.doneBreakEnd", undefined, "Break ended. Welcome back.");
          setStage({ kind: "done", message: done, queued: false });
        } else if (res.status === "queued") {
          haptic("success");
          setStage({
            kind: "done",
            message: t("m.kiosk.doneQueued", undefined, "No connection. Punch saved on this device; it will sync automatically."),
            queued: true,
          });
        } else if (res.code === "geofence_blocked") {
          haptic("warning");
          setStage({ kind: "override", method, secret, message: res.message });
        } else {
          haptic("error");
          setEntryError(res.message);
          setStage({ kind: "entry" });
        }
      } finally {
        setPending(false);
      }
    },
    [armIdle, pending, t],
  );

  // ----- PIN pad ------------------------------------------------------------
  const pressDigit = (d: string) => {
    armIdle();
    setEntryError(null);
    setPin((p) => (p.length >= 6 ? p : p + d));
  };

  const padBtn: React.CSSProperties = {
    minHeight: 64,
    minWidth: 64,
    fontSize: 24,
    justifyContent: "center",
  };

  return (
    <div className="screen screen-anim" style={{ maxWidth: 480, margin: "0 auto", paddingTop: 24 }}>
      {/* Minimal org branding + device context — no personal data at rest. */}
      <div className="scr-eye">
        {orgName}
        {projectName ? ` · ${projectName}` : ""}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 4 }}>
        {t("m.kiosk.title", undefined, "Time Clock Kiosk")}
      </h1>
      <div className="hint" style={{ marginBottom: 12 }}>
        {deviceLabel}
      </div>
      {/* Big wall clock. Placeholder until mounted (hydration-safe). */}
      <div className="ps-stat" style={{ marginBottom: 16 }}>
        <span className="v" style={{ fontSize: 44, fontVariantNumeric: "tabular-nums" }} suppressHydrationWarning>
          {clock || "--:--:--"}
        </span>
      </div>

      {entryError && stage.kind === "entry" && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {entryError}
        </div>
      )}

      {stage.kind === "entry" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              className={`ps-btn ${mode === "pin" ? "ps-btn--cta" : "ps-btn--tertiary"}`}
              style={{ flex: 1, justifyContent: "center", minHeight: 44 }}
              onClick={() => {
                armIdle();
                setMode("pin");
              }}
            >
              {t("m.kiosk.modePin", undefined, "Enter PIN")}
            </button>
            <button
              type="button"
              className={`ps-btn ${mode === "scan" ? "ps-btn--cta" : "ps-btn--tertiary"}`}
              style={{ flex: 1, justifyContent: "center", minHeight: 44 }}
              onClick={() => {
                armIdle();
                setMode("scan");
              }}
            >
              {t("m.kiosk.modeScan", undefined, "Scan Pass")}
            </button>
          </div>

          {mode === "pin" ? (
            <>
              {/* PIN dots — length only, never digits. */}
              <div
                aria-label={t("m.kiosk.pinEntered", { count: String(pin.length) }, "{count} digits entered")}
                style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16, minHeight: 14 }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: i < pin.length ? "var(--p-accent, currentColor)" : "transparent",
                      border: "2px solid var(--p-border, currentColor)",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button key={d} type="button" className="ps-btn" style={padBtn} onClick={() => pressDigit(d)}>
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  className="ps-btn ps-btn--tertiary"
                  style={padBtn}
                  onClick={() => {
                    armIdle();
                    setPin("");
                  }}
                >
                  {t("m.kiosk.clear", undefined, "Clear")}
                </button>
                <button type="button" className="ps-btn" style={padBtn} onClick={() => pressDigit("0")}>
                  0
                </button>
                <button
                  type="button"
                  className="ps-btn ps-btn--tertiary"
                  style={padBtn}
                  aria-label={t("m.kiosk.backspace", undefined, "Delete last digit")}
                  onClick={() => {
                    armIdle();
                    setPin((p) => p.slice(0, -1));
                  }}
                >
                  ⌫
                </button>
              </div>
              <button
                type="button"
                className="ps-btn ps-btn--cta ps-btn--lg"
                style={{ width: "100%", justifyContent: "center", marginTop: 16, minHeight: 52 }}
                disabled={pin.length < 4 || pending}
                onClick={() => void identify("pin", pin)}
              >
                {pending ? t("m.kiosk.checking", undefined, "Checking…") : t("m.kiosk.continue", undefined, "Continue")}
              </button>
            </>
          ) : (
            <>
              <CameraScanner
                formats={formatsForMode("access")}
                continuous={false}
                onScan={(code) => void identify("code", code.value)}
              />
              <div className="hint" style={{ marginTop: 8 }}>
                {t("m.kiosk.scanHint", undefined, "Hold your pass QR inside the frame.")}
              </div>
            </>
          )}
        </>
      )}

      {stage.kind === "identifying" && <div className="hint">{t("m.kiosk.checking", undefined, "Checking…")}</div>}

      {stage.kind === "confirm" && (
        <div>
          {/* Identity confirm card — the ONLY worker data the kiosk shows. */}
          <div className="ps-card" style={{ padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div className="scr-h" style={{ fontSize: 28 }}>
              {stage.worker.name}
            </div>
            <div className="hint">
              {stage.worker.role}
              {" · "}
              {stage.clockedIn
                ? stage.onBreak
                  ? t("m.kiosk.stateOnBreak", undefined, "On break")
                  : t("m.kiosk.stateClockedIn", undefined, "Clocked in")
                : t("m.kiosk.stateClockedOut", undefined, "Clocked out")}
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {stage.clockedIn ? (
              <>
                <button
                  type="button"
                  className="ps-btn ps-btn--cta ps-btn--lg"
                  style={{ justifyContent: "center", minHeight: 56 }}
                  disabled={pending}
                  onClick={() => void punch(stage.method, stage.secret, "clock_out")}
                >
                  {t("m.kiosk.clockOut", undefined, "Clock Out")}
                </button>
                <button
                  type="button"
                  className="ps-btn ps-btn--lg"
                  style={{ justifyContent: "center", minHeight: 52 }}
                  disabled={pending}
                  onClick={() =>
                    void punch(stage.method, stage.secret, stage.onBreak ? "break_end" : "break_start")
                  }
                >
                  {stage.onBreak
                    ? t("m.kiosk.endBreak", undefined, "End Break")
                    : t("m.kiosk.startBreak", undefined, "Start Break")}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="ps-btn ps-btn--cta ps-btn--lg"
                style={{ justifyContent: "center", minHeight: 56 }}
                disabled={pending}
                onClick={() => void punch(stage.method, stage.secret, "clock_in")}
              >
                {t("m.kiosk.clockIn", undefined, "Clock In")}
              </button>
            )}
            <button
              type="button"
              className="ps-btn ps-btn--tertiary"
              style={{ justifyContent: "center", minHeight: 44 }}
              onClick={reset}
            >
              {t("m.kiosk.notYou", undefined, "Not you? Start over")}
            </button>
          </div>
        </div>
      )}

      {stage.kind === "offline" && (
        <div>
          <div className="ps-alert" role="status" style={{ marginBottom: 12 }}>
            {t(
              "m.kiosk.offlineExplain",
              undefined,
              "No connection, so your identity can't be confirmed right now. You can still record a punch; it will sync and be verified automatically.",
            )}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ justifyContent: "center", minHeight: 56 }}
              disabled={pending}
              onClick={() => void punch(stage.method, stage.secret, "clock_in")}
            >
              {t("m.kiosk.clockIn", undefined, "Clock In")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--lg"
              style={{ justifyContent: "center", minHeight: 52 }}
              disabled={pending}
              onClick={() => void punch(stage.method, stage.secret, "clock_out")}
            >
              {t("m.kiosk.clockOut", undefined, "Clock Out")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--tertiary"
              style={{ justifyContent: "center", minHeight: 44 }}
              onClick={reset}
            >
              {t("m.kiosk.cancel", undefined, "Cancel")}
            </button>
          </div>
        </div>
      )}

      {stage.kind === "override" && (
        <div>
          <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
            {stage.message}
          </div>
          <div className="fld">
            <label htmlFor="kiosk-override">
              {t("m.kiosk.overrideLabel", undefined, "Punch anyway. Tell your manager why")}
            </label>
            <textarea
              id="kiosk-override"
              value={overrideText}
              onChange={(e) => {
                armIdle();
                setOverrideText(e.target.value);
              }}
              placeholder={t("m.kiosk.overrideHint", undefined, "e.g. Gate 3 was closed, punched from the north lot")}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className="ps-btn ps-btn--tertiary"
              style={{ flex: 1, justifyContent: "center", minHeight: 44 }}
              onClick={reset}
            >
              {t("m.kiosk.cancel", undefined, "Cancel")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--cta"
              style={{ flex: 2, justifyContent: "center", minHeight: 44 }}
              disabled={overrideText.trim().length < 10 || pending}
              onClick={() => void punch(stage.method, stage.secret, "clock_in", overrideText.trim())}
            >
              {t("m.kiosk.overrideSubmit", undefined, "Punch With Reason")}
            </button>
          </div>
        </div>
      )}

      {stage.kind === "done" && (
        <div>
          <div className={`ps-alert ${stage.queued ? "" : "ps-alert--ok"}`} role="status" style={{ marginBottom: 12 }}>
            {stage.message}
          </div>
          <button
            type="button"
            className="ps-btn ps-btn--lg"
            style={{ width: "100%", justifyContent: "center", minHeight: 44 }}
            onClick={reset}
          >
            {t("m.kiosk.nextWorker", undefined, "Done")}
          </button>
        </div>
      )}
    </div>
  );
}
