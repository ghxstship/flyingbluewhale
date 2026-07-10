"use client";

import { useEffect, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useClockPunch } from "@/components/mobile/useClockPunch";
import { useT } from "@/lib/i18n/LocaleProvider";

/** Format an elapsed millisecond span as HH:MM:SS. */
function elapsed(fromIso: string | null): string {
  if (!fromIso) return "00:00:00";
  const ms = Math.max(0, Date.now() - new Date(fromIso).getTime());
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**
 * The running time-clock face. Mirrors the kit `.te-clock` block: a live
 * HH:MM:SS counter ticking from the open entry's `started_at`, a zone
 * line, and a single clock-in / clock-out CTA wired through `useClockPunch`
 * to the queueable `/api/v1/time/clock` endpoint — offline punches queue on
 * the device and replay on reconnect; clock-in captures GPS (when granted)
 * so the punch records its geofence zone.
 */
export function CheckInControls({
  openSince,
  zoneName,
}: {
  openSince: string | null;
  zoneName: string | null;
}) {
  const t = useT();
  const { punch, pending, outcome } = useClockPunch();
  // Seed a STABLE placeholder so SSR and the client's first render match —
  // computing `elapsed()` (Date.now()) in the initializer runs on both sides at
  // different instants and hydration-mismatches when the second ticks over
  // (React #418). The effect below sets the real elapsed on mount, client-side.
  const [now, setNow] = useState("00:00:00");

  const clockedIn = openSince != null;

  // Tick the visible counter every second while on the clock.
  useEffect(() => {
    if (!openSince) {
      setNow("00:00:00");
      return;
    }
    setNow(elapsed(openSince));
    const id = setInterval(() => setNow(elapsed(openSince)), 1000);
    return () => clearInterval(id);
  }, [openSince]);

  const zoneStatus =
    outcome?.kind === "ok" && outcome.action === "clock_in"
      ? outcome.geofenceState === "inside"
        ? t("m.clock.zoneInside", { zone: outcome.zoneName ?? "" }, `In zone: ${outcome.zoneName ?? ""}`)
        : outcome.geofenceState === "outside"
          ? t("m.clock.zoneOutside", undefined, "Outside all zones. Recorded for review.")
          : t("m.clock.zoneUnknown", undefined, "No location shared with this punch.")
      : null;

  return (
    <div className="te-clock">
      <div className="wl" style={{ justifyContent: "center" }}>
        <KIcon name="MapPin" size={12} style={{ color: "var(--p-success)" }} />{" "}
        {zoneName ?? t("m.clock.noZone", undefined, "No Zone Set")}
      </div>
      <div className="tcv">{now}</div>
      {outcome?.kind === "error" && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {outcome.message}
        </div>
      )}
      {outcome?.kind === "queued" && (
        <div className="ps-alert" role="status" style={{ marginBottom: 12 }}>
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
        <div className="wl" style={{ justifyContent: "center", marginBottom: 10 }} role="status">
          {zoneStatus}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          type="button"
          className={clockedIn ? "ps-btn ps-btn--danger ps-btn--lg" : "ps-btn ps-btn--cta ps-btn--lg"}
          disabled={pending}
          onClick={() => void punch(clockedIn ? "clock_out" : "clock_in")}
        >
          {pending
            ? t("m.clock.working", undefined, "Working…")
            : clockedIn
              ? t("m.clock.clockOut", undefined, "Clock Out")
              : t("m.clock.clockIn", undefined, "Clock In")}
        </button>
      </div>
    </div>
  );
}
