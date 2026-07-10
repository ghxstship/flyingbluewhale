"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useClockPunch } from "@/components/mobile/useClockPunch";

/** Format elapsed milliseconds as H:MM:SS. */
function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * COMPVSS · Punch controls — a running shift timer with punch in / punch out,
 * backed by `time_entries` via the queueable `/api/v1/time/clock` endpoint
 * (one open entry per user, server-enforced). Offline punches queue on the
 * device and replay on reconnect; punch-in captures GPS (when granted) so the
 * entry records its geofence zone. The timer ticks client-side from the open
 * entry's `started_at`.
 */
export function PunchControls({ openStartedAt }: { openStartedAt: string | null }) {
  const t = useT();
  const { punch, pending, outcome } = useClockPunch();
  // null until mount — calling Date.now() in the initializer runs on both the
  // server and the client at different instants, so the elapsed counter text
  // hydration-mismatches (React #418). The effect sets the real clock on mount.
  const [now, setNow] = useState<number | null>(null);

  const punchedIn = !!openStartedAt;

  useEffect(() => {
    if (!punchedIn) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [punchedIn]);

  const elapsed =
    punchedIn && now != null ? fmtElapsed(now - new Date(openStartedAt!).getTime()) : "00:00:00";

  const zoneStatus =
    outcome?.kind === "ok" && outcome.action === "clock_in"
      ? outcome.geofenceState === "inside"
        ? t("m.clock.zoneInside", { zone: outcome.zoneName ?? "" }, `In zone: ${outcome.zoneName ?? ""}`)
        : outcome.geofenceState === "outside"
          ? t("m.clock.zoneOutside", undefined, "Outside all zones. Recorded for review.")
          : t("m.clock.zoneUnknown", undefined, "No location shared with this punch.")
      : null;

  return (
    <>
      <div className="te-clock">
        <div className="tcv">{elapsed}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {punchedIn ? (
            <button
              type="button"
              className="ps-btn ps-btn--danger ps-btn--lg"
              disabled={pending}
              onClick={() => void punch("clock_out")}
            >
              {t("m.punch.out", undefined, "Punch Out")}
            </button>
          ) : (
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              disabled={pending}
              style={{ background: "var(--p-success)", borderColor: "var(--p-success)", color: "var(--p-on-strong)" }}
              onClick={() => void punch("clock_in")}
            >
              {t("m.punch.in", undefined, "Punch In")}
            </button>
          )}
        </div>
      </div>
      {outcome?.kind === "error" && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 10 }}>
          {outcome.message}
        </div>
      )}
      {outcome?.kind === "queued" && (
        <div className="ps-alert" role="status" style={{ marginTop: 10 }}>
          {outcome.action === "clock_in"
            ? t(
                "m.clock.queuedIn",
                undefined,
                "Punch recorded on this device at the current time. It will sync when you're back online.",
              )
            : t(
                "m.clock.queuedOut",
                undefined,
                "Clock-out recorded on this device at the current time. It will sync when you're back online.",
              )}
        </div>
      )}
      {zoneStatus && (
        <div className="hint" style={{ textAlign: "center", marginTop: 8 }} role="status">
          {zoneStatus}
        </div>
      )}
    </>
  );
}
