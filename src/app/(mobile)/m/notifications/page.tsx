import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { AlertsList, type AlertItem } from "./AlertsList";

export const dynamic = "force-dynamic";

/**
 * /m/notifications — org broadcast & alert notifications, tone-coded with a leading
 * color bar (kit `.bar`). Reads `notifications` for the caller's org (own +
 * org-wide broadcasts where user_id is null), most urgent first. Each unread
 * row carries an Acknowledge button that stamps `notifications.read_at`.
 *
 * Design truth: prototype alerts tab (app.jsx 2443-2495). Rebuilt from scratch
 * (this route was fully reverted with no surviving siblings).
 */

// Alert-flavoured kinds map onto a tone (warn = urgent, ok = approvals,
// info = updates, neutral = general). Everything else falls to neutral.
const KIND_TONE: Record<string, "warn" | "ok" | "info" | "neutral"> = {
  alert: "warn",
  emergency: "warn",
  crisis: "warn",
  incident: "warn",
  approval: "ok",
  assignment_state: "ok",
  announcement: "info",
  assignment: "info",
  assignment_scan: "info",
};

const TONE_VAR: Record<string, string> = {
  warn: "var(--p-warning)",
  ok: "var(--p-success)",
  info: "var(--p-info)",
  neutral: "var(--p-text-3)",
};

const TONE_ICON: Record<string, string> = {
  warn: "TriangleAlert",
  ok: "CircleCheck",
  info: "Info",
  neutral: "Bell",
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return `${Math.floor(day / 7)}w`;
}

export default async function MobileAlertsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.alerts.eyebrow", undefined, "Alerts")}</div>
        <h1 className="scr-h">{t("m.alerts.title", undefined, "Notifications")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  // Own notifications + org-wide broadcasts (user_id null), org-pinned.
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, created_at, read_at, user_id")
    .eq("org_id", session.orgId)
    .or(`user_id.eq.${session.userId},user_id.is.null`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  type AlertRow = {
    id: string;
    kind: string;
    title: string;
    body: string | null;
    created_at: string;
    read_at: string | null;
  };
  const rows = (data ?? []) as AlertRow[];
  const unread = rows.filter((a) => a.read_at == null).length;

  const items: AlertItem[] = rows.map((a) => {
    const tone = KIND_TONE[a.kind] ?? "neutral";
    return {
      id: a.id,
      title: a.title,
      body: a.body || toTitle(a.kind),
      tone,
      color: TONE_VAR[tone] ?? "var(--p-text-3)",
      iconName: TONE_ICON[tone] ?? "Bell",
      when: relativeTime(a.created_at),
      read: a.read_at != null,
      sortAt: a.created_at,
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.alerts.eyebrow", { count: unread }, `${unread} New`)}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.alerts.title", undefined, "Notifications")}
      </h1>

      <AlertsList items={items} />
    </div>
  );
}
