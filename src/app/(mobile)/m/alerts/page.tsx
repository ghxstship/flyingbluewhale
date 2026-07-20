import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { CrisisPanel, type ActiveCrisis } from "../emergency/CrisisPanel";
import { CRISIS_ACTIVE_WINDOW_MS, crisisSeverityTone } from "../emergency/crisis";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Crisis Alerts (kit 29, ratified 2026-07-17) — the org's
 * mass-notify crisis surface. Olympic-scope: the console declares into
 * `crisis_alerts` (crisis.declare, unsilenceable push fan-out) and this is
 * where the field reads the declaration, answers it, and can scroll the
 * full alert history.
 *
 * Deliberately DISTINCT from the bell: /m/notifications is the routine
 * per-person feed (mentions, approvals, schedule changes); this surface
 * carries only org-wide crisis broadcasts, severity-toned, with the
 * response actions and a hard link to the response plan on /m/emergency.
 *
 * Route history: this path 308-redirected to /m/notifications after kit 28
 * moved the bell feed there. Kit 29 reclaims it as a real page — old push
 * payloads that still carry `url: "/m/alerts"` now land on the crisis
 * surface, which is a strictly better tap target for a `crisis` push.
 *
 * Shape: the ACTIVE alert (recency window shared with /m/emergency) leads
 * via the same CrisisPanel — Acknowledge Muster / Mark Myself Safe, offline
 * queued, idempotent receipts — then the newest-first log of every earlier
 * declaration with the caller's acknowledged state read from
 * `crisis_alert_receipts`. `crisis_alerts` has no soft-delete column, so
 * there is no `deleted_at` guard to apply here.
 */

type AlertRow = {
  id: string;
  title: string;
  body: string;
  severity: string;
  created_at: string;
};

type MyReceipts = { musterAckAt: string | null; safeAt: string | null; needHelpAt: string | null };

export default async function CrisisAlertsPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const { dateParts } = await getRequestFormatters();

  let alerts: AlertRow[] = [];
  const receiptsByAlert = new Map<string, MyReceipts>();

  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("crisis_alerts")
      .select("id, title, body, severity, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50);
    alerts = (data ?? []) as AlertRow[];

    if (alerts.length) {
      const { data: receipts } = await supabase
        .from("crisis_alert_receipts")
        .select("alert_id, channel, acknowledged_at")
        .in("alert_id", alerts.map((a) => a.id))
        .eq("user_id", session.userId)
        .in("channel", ["muster_ack", "self_safe", "need_help"]);
      for (const r of receipts ?? []) {
        const entry =
          receiptsByAlert.get(r.alert_id) ?? { musterAckAt: null, safeAt: null, needHelpAt: null };
        if (r.channel === "muster_ack") entry.musterAckAt = r.acknowledged_at;
        if (r.channel === "self_safe") entry.safeAt = r.acknowledged_at;
        if (r.channel === "need_help") entry.needHelpAt = r.acknowledged_at;
        receiptsByAlert.set(r.alert_id, entry);
      }
    }
  }

  // The newest alert inside the shared recency window is the ACTIVE one —
  // same definition as /m/emergency, so the two surfaces agree.
  const since = Date.now() - CRISIS_ACTIVE_WINDOW_MS;
  const activeRow =
    alerts[0] && new Date(alerts[0].created_at).getTime() >= since ? alerts[0] : null;
  const active: ActiveCrisis | null = activeRow
    ? {
        id: activeRow.id,
        title: activeRow.title,
        body: activeRow.body,
        severity: activeRow.severity,
        createdAt: activeRow.created_at,
      }
    : null;
  const activeReceipts = activeRow ? receiptsByAlert.get(activeRow.id) : undefined;
  const log = alerts.filter((a) => a.id !== activeRow?.id);

  const sevLabel = (severity: string) =>
    severity === "critical"
      ? t("m.crisisAlerts.critical", undefined, "Critical")
      : severity === "warn"
        ? t("m.crisisAlerts.warn", undefined, "Warning")
        : t("m.crisisAlerts.info", undefined, "Info");

  const when = (iso: string) =>
    dateParts(iso, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="screen screen-anim">
      <Link href="/m" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.crisisAlerts.back", undefined, "Home")}
      </Link>
      <div className="scr-eye">{t("m.crisisAlerts.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 6 }}>
        {t("m.crisisAlerts.title", undefined, "Crisis Alerts")}
      </h1>

      {/* The bell distinction, stated up front: this is the crisis channel,
          not the routine feed. */}
      <div className="hint" style={{ marginBottom: 12 }}>
        {t("m.crisisAlerts.bellNote", undefined, "Org-wide crisis broadcasts only. Routine updates stay in Notifications under the bell.")}{" "}
        <Link href="/m/notifications" style={{ color: "var(--p-text-2)" }}>
          {t("m.crisisAlerts.bellLink", undefined, "Open Notifications")}
        </Link>
      </div>

      {/* Active crisis leads — the shared panel with the response actions.
          All-clear is stated, not implied. */}
      {active ? (
        <CrisisPanel
          alert={active}
          initialMusterAckAt={activeReceipts?.musterAckAt ?? null}
          initialSafeAt={activeReceipts?.safeAt ?? null}
          initialNeedHelpAt={activeReceipts?.needHelpAt ?? null}
        />
      ) : (
        <div className="item">
          <span className="bar" style={{ background: "var(--p-success)" }} />
          <div>
            <div className="t">{t("m.crisisAlerts.allClear", undefined, "No Active Crisis")}</div>
            <div className="s">
              {t("m.crisisAlerts.allClearBody", undefined, "If a code is declared, it appears here with your response actions.")}
            </div>
          </div>
        </div>
      )}

      {/* Response plan — the Emergency card carries the muster station,
          evacuation quick-jumps, and the venue code set. */}
      <Link href="/m/emergency" className="item tap" style={{ cursor: "pointer", textDecoration: "none" }}>
        <KIcon name="Shield" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.crisisAlerts.planTitle", undefined, "Response Plan")}</div>
          <div className="s">
            {t("m.crisisAlerts.planBody", undefined, "Your Emergency Card: muster station, evacuation routes, and venue codes.")}
          </div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </Link>

      {/* The log — every declaration, newest first, with the caller's own
          acknowledged state. History is read-only; the response actions
          belong to the active alert above. */}
      <div className="sech">
        <h2>{t("m.crisisAlerts.log", undefined, "Alert Log")}</h2>
      </div>
      {log.length === 0 ? (
        <div className="item">
          <span className="bar" style={{ background: "var(--p-border)" }} />
          <div>
            <div className="t">
              {alerts.length === 0
                ? t("m.crisisAlerts.emptyLog", undefined, "No crisis alerts have been declared.")
                : t("m.crisisAlerts.emptyEarlier", undefined, "No earlier alerts.")}
            </div>
          </div>
        </div>
      ) : (
        log.map((a) => {
          const tone = crisisSeverityTone(a.severity);
          const r = receiptsByAlert.get(a.id);
          const acked = Boolean(r?.musterAckAt || r?.safeAt);
          return (
            <div className="item" key={a.id}>
              <span className="bar" style={{ background: tone }} />
              <div style={{ minWidth: 0 }}>
                <div className="t">{a.title}</div>
                <div className="s" style={{ whiteSpace: "pre-wrap" }}>
                  {a.body}
                </div>
              </div>
              <span className="sp" />
              <div style={{ textAlign: "right", flex: "none" }}>
                <div className="time" style={{ color: tone }}>
                  {sevLabel(a.severity)}
                </div>
                <div className="s">{when(a.created_at)}</div>
                {acked && (
                  <div
                    className="s"
                    style={{
                      color: "var(--p-success)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <KIcon name="Check" size={12} /> {t("m.crisisAlerts.acked", undefined, "Acknowledged")}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
