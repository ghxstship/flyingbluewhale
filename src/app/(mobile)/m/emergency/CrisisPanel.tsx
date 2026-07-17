"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { KIcon } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { respondToCrisisAction } from "./actions";

/** Queue channel — one constant so enqueue and drain agree (kit 21 W8). */
const QUEUE_KIND = "crisis-respond";

type Response = "muster_ack" | "self_safe";

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
 * Two full-width thumb targets: acknowledge the muster instruction, mark
 * myself safe. Both queue offline (the whole point of a crisis surface is
 * that the network is the first casualty): a submit with no signal is
 * enqueued with a STABLE id per (alert, response), so replays and double
 * taps collapse into the same idempotent upsert the server action performs.
 *
 * The buttons flip optimistically on "sent" AND "queued" — a crew member
 * standing at a muster point must not be told their acknowledgement failed
 * just because the cell site is down; the queued state is surfaced by the
 * sync banner and the per-row "will sync" hint instead.
 */
export function CrisisPanel({
  alert,
  initialMusterAckAt,
  initialSafeAt,
}: {
  alert: ActiveCrisis;
  initialMusterAckAt: string | null;
  initialSafeAt: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<Response, boolean>>({
    muster_ack: initialMusterAckAt != null,
    self_safe: initialSafeAt != null,
  });
  const [queuedLocal, setQueuedLocal] = useState<Record<Response, boolean>>({
    muster_ack: false,
    self_safe: false,
  });
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
      setDone((d) => ({ ...d, [response]: true }));
      setQueuedLocal((q) => ({ ...q, [response]: outcome === "queued" }));
      if (outcome === "sent") router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const sevTone =
    alert.severity === "critical"
      ? "var(--p-danger)"
      : alert.severity === "warn"
        ? "var(--p-warning)"
        : "var(--p-info)";
  const sevLabel =
    alert.severity === "critical"
      ? t("m.emergency.crisis.critical", undefined, "Critical")
      : alert.severity === "warn"
        ? t("m.emergency.crisis.warn", undefined, "Warning")
        : t("m.emergency.crisis.info", undefined, "Info");

  const declared = new Date(alert.createdAt);
  const declaredLabel = Number.isNaN(declared.getTime())
    ? ""
    : declared.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

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

      {/* Full-width thumb targets. Muster first: get to the point, then report. */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`ps-btn ps-btn--lg ${done.muster_ack ? "ps-btn--secondary" : "ps-btn--cta"}`}
          style={{ width: "100%", justifyContent: "center" }}
          disabled={done.muster_ack || busy === "muster_ack"}
          onClick={() => respond("muster_ack")}
        >
          {done.muster_ack ? (
            <>
              <KIcon name="Check" size={16} /> {t("m.emergency.crisis.mustered", undefined, "Muster Acknowledged")}
            </>
          ) : busy === "muster_ack" ? (
            t("m.emergency.crisis.sending", undefined, "Sending…")
          ) : (
            t("m.emergency.crisis.ackMuster", undefined, "Acknowledge Muster")
          )}
        </button>
        {done.muster_ack && queuedLocal.muster_ack && (
          <div className="hint" style={{ textAlign: "center" }}>
            {t("m.emergency.crisis.willSync", undefined, "Saved to this device. Will sync when you're back online.")}
          </div>
        )}

        <button
          type="button"
          className={`ps-btn ps-btn--lg ${done.self_safe ? "ps-btn--secondary" : "ps-btn--cta"}`}
          style={{ width: "100%", justifyContent: "center" }}
          disabled={done.self_safe || busy === "self_safe"}
          onClick={() => respond("self_safe")}
        >
          {done.self_safe ? (
            <>
              <KIcon name="ShieldCheck" size={16} /> {t("m.emergency.crisis.safeDone", undefined, "Marked Safe")}
            </>
          ) : busy === "self_safe" ? (
            t("m.emergency.crisis.sending", undefined, "Sending…")
          ) : (
            t("m.emergency.crisis.markSafe", undefined, "Mark Myself Safe")
          )}
        </button>
        {done.self_safe && queuedLocal.self_safe && (
          <div className="hint" style={{ textAlign: "center" }}>
            {t("m.emergency.crisis.willSync", undefined, "Saved to this device. Will sync when you're back online.")}
          </div>
        )}
      </div>
    </section>
  );
}
