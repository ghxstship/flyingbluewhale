"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";
import { KIcon } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { respondToCrisisAction } from "./actions";
import { crisisSeverityTone } from "./crisis";

/** Queue channel — one constant so enqueue and drain agree (kit 21 W8). */
const QUEUE_KIND = "crisis-respond";

type Response = "muster_ack" | "self_safe" | "need_help";

export type ActiveCrisis = {
  id: string;
  title: string;
  body: string;
  severity: string;
  createdAt: string;
};

/**
 * COMPVSS · Active Crisis panel — the field's answer to a declared code.
 *
 * Kit 32 E1: the one-tap safety check-in pair — "I'm Safe" / "Need Help"
 * (52px targets) — leads the panel; the muster acknowledgement rides below.
 * Every response is a real `crisis_alert_receipts` row keyed
 * (alert, user, channel), so selection persists across reloads and devices;
 * "Need Help" additionally pushes an ops alert to the manager band (server
 * action, `crisis` kind). The current status is whichever of safe/help was
 * recorded LAST — a worker who called for help and then reached the muster
 * point taps "I'm Safe" and the count moves.
 *
 * All responses queue offline (the whole point of a crisis surface is that
 * the network is the first casualty): a submit with no signal is enqueued
 * with a STABLE id per (alert, response), so replays and double taps
 * collapse into the same idempotent upsert the server action performs. The
 * buttons flip optimistically on "sent" AND "queued" — a crew member
 * standing at a muster point must not be told their check-in failed just
 * because the cell site is down; the queued state is surfaced by the sync
 * banner and the per-row "will sync" hint instead.
 */
export function CrisisPanel({
  alert,
  initialMusterAckAt,
  initialSafeAt,
  initialNeedHelpAt,
}: {
  alert: ActiveCrisis;
  initialMusterAckAt: string | null;
  initialSafeAt: string | null;
  initialNeedHelpAt: string | null;
}) {
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Latest-wins between the two safety statuses: both may exist as receipt
  // rows; the newer acknowledged_at is the holder's current answer.
  const initialStatus: "safe" | "help" | null =
    initialSafeAt && initialNeedHelpAt
      ? initialSafeAt >= initialNeedHelpAt
        ? "safe"
        : "help"
      : initialSafeAt
        ? "safe"
        : initialNeedHelpAt
          ? "help"
          : null;
  const [safeStatus, setSafeStatus] = useState<"safe" | "help" | null>(initialStatus);
  const [musterDone, setMusterDone] = useState(initialMusterAckAt != null);
  const [queuedLocal, setQueuedLocal] = useState<Partial<Record<Response, boolean>>>({});
  const [busy, setBusy] = useState<Response | null>(null);

  const { online, pending, syncing, submit } = useOfflineQueue<{ alertId: string; response: Response }>(
    QUEUE_KIND,
    async (payload) => {
      const res = await respondToCrisisAction(payload);
      if (res?.error) {
        setError(res.error);
        return false; // business error (alert gone) — do not retry forever
      }
      return true;
    },
  );

  async function respond(response: Response) {
    if (busy) return;
    setError(null);
    setBusy(response);
    try {
      // Stable id: one queue slot per (alert, response). A double tap or a
      // reload while offline re-enqueues onto the same slot instead of
      // stacking duplicates.
      const outcome = await submit(`${QUEUE_KIND}-${alert.id}-${response}`, {
        alertId: alert.id,
        response,
      });
      if (outcome === "failed") return; // error already surfaced by send
      if (response === "muster_ack") setMusterDone(true);
      if (response === "self_safe") setSafeStatus("safe");
      if (response === "need_help") setSafeStatus("help");
      setQueuedLocal((q) => ({ ...q, [response]: outcome === "queued" }));
      if (outcome === "sent") router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const sevTone = crisisSeverityTone(alert.severity);
  const sevLabel =
    alert.severity === "critical"
      ? t("m.emergency.crisis.critical", undefined, "Critical")
      : alert.severity === "warn"
        ? t("m.emergency.crisis.warn", undefined, "Warning")
        : t("m.emergency.crisis.info", undefined, "Info");

  const declared = new Date(alert.createdAt);
  const declaredLabel = Number.isNaN(declared.getTime()) ? "" : fmt.time(declared);

  /** Shared 52px check-in target (kit 32 E1 grammar). */
  const pairStyle = (on: boolean, tone: string): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 14,
    border: on ? `2px solid ${tone}` : "1px solid var(--p-border)",
    background: on ? `color-mix(in oklab, ${tone} 14%, var(--p-surface))` : "var(--p-surface)",
    color: tone,
  });

  return (
    <section aria-label={t("m.emergency.crisis.section", undefined, "Active Crisis")}>
      <OfflineSyncBanner
        online={online}
        pending={pending}
        syncing={syncing}
        labels={{
          offline: t("m.emergency.crisis.offline", undefined, "You're offline. Responses save to your device and sync later."),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />

      <div className="sech">
        <h2>{t("m.emergency.crisis.section", undefined, "Active Crisis")}</h2>
      </div>

      {/* Kit 32 E1 — the one-tap safety check-in pair leads the panel. */}
      <div style={{ display: "flex", gap: 10, margin: "2px 0 12px" }}>
        <button
          type="button"
          onClick={() => respond("self_safe")}
          disabled={busy != null}
          aria-pressed={safeStatus === "safe"}
          style={pairStyle(safeStatus === "safe", "var(--p-success)")}
        >
          <KIcon name="ShieldCheck" size={18} />
          {busy === "self_safe"
            ? t("m.emergency.crisis.sending", undefined, "Sending…")
            : t("m.emergency.crisis.imSafe", undefined, "I'm Safe")}
          {safeStatus === "safe" && busy !== "self_safe" && <KIcon name="Check" size={15} />}
        </button>
        <button
          type="button"
          onClick={() => respond("need_help")}
          disabled={busy != null}
          aria-pressed={safeStatus === "help"}
          style={pairStyle(safeStatus === "help", "var(--p-danger)")}
        >
          <KIcon name="Siren" size={18} />
          {busy === "need_help"
            ? t("m.emergency.crisis.sending", undefined, "Sending…")
            : t("m.emergency.crisis.needHelp", undefined, "Need Help")}
        </button>
      </div>
      {safeStatus === "help" && !queuedLocal.need_help && (
        <div className="hint" style={{ textAlign: "center", marginBottom: 10 }}>
          {t("m.emergency.crisis.helpSent", undefined, "Your lead has been alerted. Stay where you are if it's safe to.")}
        </div>
      )}
      {((safeStatus === "safe" && queuedLocal.self_safe) || (safeStatus === "help" && queuedLocal.need_help)) && (
        <div className="hint" style={{ textAlign: "center", marginBottom: 10 }}>
          {t("m.emergency.crisis.willSync", undefined, "Saved to this device. Will sync when you're back online.")}
        </div>
      )}

      {/* The declaration — kit .item row, severity riding the bar. */}
      <div className="item" role="alert" style={{ borderColor: `color-mix(in oklab, ${sevTone} 40%, var(--p-border))` }}>
        <span className="bar" style={{ background: sevTone }} />
        <div style={{ minWidth: 0 }}>
          <div className="t">{alert.title}</div>
          <div className="s" style={{ whiteSpace: "pre-wrap" }}>
            {alert.body}
          </div>
        </div>
        <span className="sp" />
        <div style={{ textAlign: "right", flex: "none" }}>
          <div className="time" style={{ color: sevTone }}>
            {sevLabel}
          </div>
          {declaredLabel && <div className="s">{declaredLabel}</div>}
        </div>
      </div>

      {error && (
        <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Full-width muster acknowledgement below the pair. */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`ps-btn ps-btn--lg ${musterDone ? "ps-btn--secondary" : "ps-btn--cta"}`}
          style={{ width: "100%", justifyContent: "center" }}
          disabled={musterDone || busy === "muster_ack"}
          onClick={() => respond("muster_ack")}
        >
          {musterDone ? (
            <>
              <KIcon name="Check" size={16} /> {t("m.emergency.crisis.mustered", undefined, "Muster Acknowledged")}
            </>
          ) : busy === "muster_ack" ? (
            t("m.emergency.crisis.sending", undefined, "Sending…")
          ) : (
            t("m.emergency.crisis.ackMuster", undefined, "Acknowledge Muster")
          )}
        </button>
        {musterDone && queuedLocal.muster_ack && (
          <div className="hint" style={{ textAlign: "center" }}>
            {t("m.emergency.crisis.willSync", undefined, "Saved to this device. Will sync when you're back online.")}
          </div>
        )}
      </div>
    </section>
  );
}
