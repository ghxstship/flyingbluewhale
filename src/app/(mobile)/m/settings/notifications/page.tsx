import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { KIcon } from "@/components/mobile/kit";
import { NotifMatrix, type MatrixState } from "./NotifMatrix";
import { NOTIF_ROWS, CHANNELS } from "./constants";

export const dynamic = "force-dynamic";

/**
 * /m/settings/notifications — per-channel notification preference matrix + a recent
 * activity list. The matrix reads `notification_preferences.matrix` (jsonb,
 * keyed `[category][channel] = boolean`) and persists single-cell toggles via
 * the surviving `toggleNotifPref` action. Below it, recent `notifications`
 * render as tone-coded rows.
 *
 * Design truth: prototype settings notif-matrix (app.jsx 3306-3704).
 */

export default async function MobileNotificationsPage() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.notifications.eyebrow", undefined, "Settings")}</div>
        <h1 className="scr-h">{t("m.settings.notifications.title", undefined, "Notification Preferences")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: prefs }, { data: recent }] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("matrix")
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("notifications")
      .select("id, kind, title, body, created_at, read_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Seed the matrix UI from the persisted prefs, keyed by canonical PushKind.
  // A display row is ON for a channel unless one of the kinds it owns is
  // explicitly off; missing cells default to push-on, email/text-off.
  const stored = (prefs?.matrix as Record<string, Record<string, boolean>> | null) ?? {};
  const initial: MatrixState = {};
  for (const r of NOTIF_ROWS) {
    const cells: Record<string, boolean> = {};
    for (const ch of CHANNELS) {
      const anyStored = r.kinds.some((k) => stored[k]?.[ch] !== undefined);
      const anyOff = r.kinds.some((k) => stored[k]?.[ch] === false);
      cells[ch] = anyStored ? !anyOff : ch === "push";
    }
    initial[r.id] = cells;
  }
  // Stable id on the wire, translated label for display only.
  const categories = NOTIF_ROWS.map((r) => ({
    id: r.id,
    label: t(`m.settings.notif.row.${r.id}`, undefined, r.label),
  }));

  type NotifRow = {
    id: string;
    kind: string;
    title: string;
    body: string | null;
    created_at: string;
    read_at: string | null;
  };
  const rows = (recent ?? []) as NotifRow[];
  const unread = rows.filter((n) => n.read_at == null).length;

  const labels = {
    heading: t("m.notifications.matrixHeading", undefined, "Delivery"),
    push: t("m.notifications.channel.push", undefined, "Push"),
    email: t("m.notifications.channel.email", undefined, "Email"),
    text: t("m.notifications.channel.text", undefined, "Text"),
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t("m.notifications.eyebrow", { count: unread }, `${unread} New`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.settings.notifications.title", undefined, "Notification Preferences")}
      </h1>

      <NotifMatrix categories={categories} channels={CHANNELS} initial={initial} labels={labels} />

      <div className="sech">
        <h2>{t("m.notifications.recentHeading", undefined, "Recent")}</h2>
        {rows.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{rows.length}</span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="item">
          <div className="s">{t("m.notifications.emptyTitle", undefined, "You're all caught up.")}</div>
        </div>
      ) : (
        rows.map((n) => (
          <div className="item" key={n.id} style={{ opacity: n.read_at ? 0.65 : 1 }}>
            <span
              className="bar"
              style={{ background: n.read_at ? "var(--p-text-3)" : "var(--p-accent)" }}
            />
            <KIcon name="Bell" size={18} style={{ color: "var(--p-text-2)" }} />
            <div style={{ minWidth: 0 }}>
              <div className="t">{n.title}</div>
              <div className="s">{n.body || toTitle(n.kind)}</div>
            </div>
            <span className="sp" />
            <span className="time">{fmt.relative(n.created_at, { compact: true })}</span>
          </div>
        ))
      )}
    </div>
  );
}
