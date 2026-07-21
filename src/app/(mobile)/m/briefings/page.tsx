import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { BriefingsListView, type BriefingItem } from "./BriefingsListView";

/**
 * COMPVSS · Safety Briefings — today's toolbox talks, plus the coming week.
 *
 * G11 (briefing.signin) in the parity audit: the console's own empty state
 * has promised "Crew acknowledges via mobile" since the briefings surface
 * shipped, and no such surface existed — an operator proxy-signed every
 * attendee by hand, which is exactly the attendance record a safety audit
 * throws out. This list is the deliverer's way in ("what am I running
 * today?") and the crew's way in when they didn't scan the QR.
 *
 * Kit 34 view engine: the same org-wide window now renders through
 * NormalizedList (list/table/board/calendar). The calendar view — driven by
 * `scheduled_for` — replaces the old hand-rolled Today / This-Week grouping.
 *
 * Org-scoped read (safety_briefings RLS is org-member SELECT) — a briefing
 * is a site-wide event, not a personal record, so unlike /m/expenses there
 * is deliberately no self filter here.
 */
export const dynamic = "force-dynamic";

type BriefingRow = {
  id: string;
  topic: string;
  briefing_state: string;
  scheduled_for: string;
  conducted_at: string | null;
  project: { name: string | null } | null;
};

export default async function BriefingsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.briefings.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();

  // Window: from the start of today through the next 7 days. Yesterday's
  // talk is history the console owns; today's and this week's are the ones
  // a crew member can still walk into.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const windowEnd = new Date(startOfToday.getTime() + 8 * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("safety_briefings")
    .select("id, topic, briefing_state, scheduled_for, conducted_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .gte("scheduled_for", startOfToday.toISOString())
    .lt("scheduled_for", windowEnd.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(50);

  const rows = (data ?? []) as unknown as BriefingRow[];

  // Flatten to the client view's shape — resolved project name + preformatted
  // date (the client can't reach the DB or the request formatters) + the ISO
  // day for the calendar view.
  const items: BriefingItem[] = rows.map((r) => ({
    id: r.id,
    topic: r.topic,
    briefing_state: r.briefing_state,
    scheduledLabel: fmt.dateTime(r.scheduled_for),
    scheduledIso: r.scheduled_for ? r.scheduled_for.slice(0, 10) : "",
    projectName: r.project?.name ?? null,
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.briefings.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.briefings.title", undefined, "Safety Briefings")}
      </h1>

      <BriefingsListView items={items} />
    </div>
  );
}
