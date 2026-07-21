"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { useClockPunch } from "@/components/mobile/useClockPunch";
import { WillSyncChip } from "@/components/mobile/WillSyncChip";
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
 * the device and replay on reconnect; both directions capture GPS (when
 * granted) so the punch records its geofence zone.
 *
 * When the org runs a blocking geofence policy, an off-site punch comes back
 * refused with an override path rather than a dead end: the worker states a
 * reason and the punch lands flagged for a manager. A geofence must never
 * leave someone unable to record time they worked.
 */
export function CheckInControls({
  openSince,
  onBreakSince,
  zoneName,
}: {
  openSince: string | null;
  onBreakSince: string | null;
  zoneName: string | null;
}) {
  const t = useT();
  const { punch, pending, outcome, clearOutcome } = useClockPunch();
  const [overrideReason, setOverrideReason] = useState("");
  // Seed a STABLE placeholder so SSR and the client's first render match —
  // computing `elapsed()` (Date.now()) in the initializer runs on both sides at
  // different instants and hydration-mismatches when the second ticks over
  // (React #418). The effect below sets the real elapsed on mount, client-side.
  const [now, setNow] = useState("00:00:00");

  const clockedIn = openSince != null;
  const onBreak = onBreakSince != null;

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

  const blocked = outcome?.kind === "blocked" ? outcome : null;
  const flagged = outcome?.kind === "ok" && outcome.enforcementState === "quarantined";
  const canOverride = overrideReason.trim().length >= 10;

  function submitOverride() {
    if (!blocked || !canOverride) return;
    void punch(blocked.action, { overrideReason: overrideReason.trim() });
    setOverrideReason("");
  }

  return (
    <div className="te-clock">
      <div className="wl" style={{ justifyContent: "center" }}>
        <KIcon name="MapPin" size={12} style={{ color: "var(--p-success)" }} />{" "}
        {zoneName ?? t("m.clock.noZone", undefined, "No Zone Set")}
      </div>
      <div className="tcv">{now}</div>
      {/* Kit 32 B2: pending punches sitting in the durable outbox — survives
          a reload, clears only when the queue really drains. */}
      <WillSyncChip endpoints={["/api/v1/time/clock"]} align="center" />
      {outcome?.kind === "error" && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {outcome.message}
        </div>
      )}
      {outcome?.kind === "queued" && (outcome.action === "clock_in" || outcome.action === "clock_out") && (
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
      {outcome?.kind === "ok" && outcome.action === "break_start" && (
        <div className="ps-alert ps-alert--warn" role="status" style={{ marginBottom: 12 }}>
          {t("m.clock.breakStarted", undefined, "Break started. You're still clocked in.")}
        </div>
      )}
      {outcome?.kind === "ok" && outcome.action === "break_end" && (
        <div className="ps-alert" role="status" style={{ marginBottom: 12 }}>
          {t("m.clock.breakEnded", undefined, "Break ended. Back on the clock.")}
        </div>
      )}
      {outcome?.kind === "queued" && (outcome.action === "break_start" || outcome.action === "break_end") && (
        <div className="ps-alert" role="status" style={{ marginBottom: 12 }}>
          {t("m.clock.breakQueued", undefined, "Break recorded on this device. It will sync when you're back online.")}
        </div>
      )}
      {/* End-of-shift handover prompt — a completed online clock-out surfaces
          the handover form as a dismissible in-place nudge (kit prototype opens
          it on clock-out), keeping the worker on the clock face rather than
          force-navigating. */}
      {outcome?.kind === "ok" && outcome.action === "clock_out" && (
        <div
          className="ps-alert"
          role="status"
          style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
        >
          <KIcon name="ClipboardCheck" size={16} style={{ flex: "none" }} />
          <span style={{ flex: 1, minWidth: 140 }}>
            {t("m.clock.handoverPrompt", undefined, "Shift ended. Log your handover?")}
          </span>
          <Link href="/m/handover/new" className="ps-btn ps-btn--sm">
            {t("m.clock.handoverCta", undefined, "Log Handover")}
          </Link>
          <button type="button" className="ps-btn ps-btn--tertiary ps-btn--sm" onClick={clearOutcome}>
            {t("m.clock.handoverDismiss", undefined, "Not Now")}
          </button>
        </div>
      )}
      {flagged && (
        <div className="ps-alert ps-alert--warn" role="status" style={{ marginBottom: 12 }}>
          {t(
            "m.clock.flaggedForReview",
            undefined,
            "Punch recorded and sent to your supervisor to confirm. You're on the clock.",
          )}
        </div>
      )}
      {blocked && (
        <div className="ps-alert ps-alert--warn" role="alert" style={{ marginBottom: 12, textAlign: "left" }}>
          <div style={{ marginBottom: 8 }}>{blocked.message}</div>
          <label
            htmlFor="clock-override-reason"
            className="ps-caption"
            style={{ display: "block", marginBottom: 4 }}
          >
            {t("m.clock.overrideLabel", undefined, "Why are you clocking in from here?")}
          </label>
          <textarea
            id="clock-override-reason"
            className="ps-input"
            rows={2}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder={t("m.clock.overridePlaceholder", undefined, "Gate 3 closed, crew staged at the north lot")}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="ps-btn ps-btn--sm"
              disabled={pending || !canOverride}
              onClick={submitOverride}
            >
              {t("m.clock.overrideSubmit", undefined, "Clock in anyway")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--tertiary ps-btn--sm"
              disabled={pending}
              onClick={() => {
                setOverrideReason("");
                clearOutcome();
              }}
            >
              {t("m.clock.overrideCancel", undefined, "Cancel")}
            </button>
          </div>
        </div>
      )}
      {zoneStatus && (
        <div className="wl" style={{ justifyContent: "center", marginBottom: 10 }} role="status">
          {zoneStatus}
        </div>
      )}
      {onBreak && (
        <div
          className="wl"
          style={{ justifyContent: "center", marginBottom: 10, color: "var(--p-warning)" }}
          role="status"
        >
          <KIcon name="Coffee" size={12} /> {t("m.clock.onBreakNow", undefined, "On break")}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {clockedIn && (
          <button
            type="button"
            className={onBreak ? "ps-btn ps-btn--cta ps-btn--lg" : "ps-btn ps-btn--secondary ps-btn--lg"}
            disabled={pending}
            onClick={() => void punch(onBreak ? "break_end" : "break_start")}
          >
            {onBreak
              ? t("m.clock.endBreak", undefined, "End Break")
              : t("m.clock.startBreak", undefined, "Start Break")}
          </button>
        )}
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
