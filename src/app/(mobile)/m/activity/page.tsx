import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { ActivityView, type ActivityRow } from "./ActivityView";

export const dynamic = "force-dynamic";

/**
 * /m/activity — Activity History (timeline).
 *
 * COMPVSS kit `tab==="activity"` + ACTIVITY (design truth app.jsx 2798-2841,
 * 731-745). The prototype's unified event log (scans, assets, access, reports,
 * clock, tasks) has no single backing table, so we honestly compose the
 * timeline from two real sources scoped to the viewer:
 *   • `assignment_events` where actor_user_id = me (scans, state changes, …)
 *   • `notifications` for me (reports/alerts that landed in my bell)
 * merged + sorted by time, with a type filter mirroring the kit.
 */

const EVENT_KIND_META: Record<string, { type: string; icon: string }> = {
  scan: { type: "Scan", icon: "ScanLine" },
  consume: { type: "Asset", icon: "Package" },
  state_change: { type: "Assignment", icon: "ClipboardList" },
  comment: { type: "Comment", icon: "MessageSquare" },
  version: { type: "Assignment", icon: "GitCommitHorizontal" },
  void: { type: "Asset", icon: "Ban" },
  reissue: { type: "Asset", icon: "RefreshCw" },
};

const NOTIF_KIND_TYPE: Record<string, string> = {
  incident: "Report",
  assignment: "Asset",
  assignment_state: "Assignment",
  assignment_scan: "Scan",
  announcement: "Update",
  chat: "Message",
};

export default async function ActivityPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data: events }, { data: notifs }] = await Promise.all([
    supabase
      .from("assignment_events")
      .select("id, event_kind, from_state, to_state, body, at")
      .eq("org_id", session.orgId)
      .eq("actor_user_id", session.userId)
      .order("at", { ascending: false })
      .limit(60),
    supabase
      .from("notifications")
      .select("id, title, body, kind, created_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const rows: ActivityRow[] = [];

  for (const e of events ?? []) {
    const meta = EVENT_KIND_META[(e.event_kind as string) ?? ""] ?? {
      type: "Activity",
      icon: "Activity",
    };
    const detail =
      e.event_kind === "state_change" && e.to_state
        ? `${e.from_state ?? "—"} → ${e.to_state}`
        : ((e.body as string) ?? "");
    rows.push({
      id: `ev-${e.id}`,
      type: meta.type,
      icon: meta.icon,
      title: detail || meta.type,
      detail,
      at: (e.at as string) ?? "",
    });
  }

  for (const n of notifs ?? []) {
    const type = NOTIF_KIND_TYPE[(n.kind as string) ?? ""] ?? "Update";
    rows.push({
      id: `nt-${n.id}`,
      type,
      icon: "Bell",
      title: (n.title as string) ?? "",
      detail: (n.body as string) ?? "",
      at: (n.created_at as string) ?? "",
    });
  }

  rows.sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="screen screen-anim">
      <a className="backbtn" href="/m/more">
        <ChevronLeft size={17} /> {t("m.more.title", undefined, "More")}
      </a>
      <div className="scr-eye">{t("m.activity.count", { n: rows.length }, `${rows.length} Events`)}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.activity.title", undefined, "Activity History")}
      </h1>
      <ActivityView
        rows={rows}
        labels={{
          search: t("m.activity.search", undefined, "Search Activity…"),
          emptyTitle: t("m.activity.empty", undefined, "No Activity"),
          emptyBody: t("m.activity.emptyBody", undefined, "Nothing matches these filters."),
        }}
      />
    </div>
  );
}
