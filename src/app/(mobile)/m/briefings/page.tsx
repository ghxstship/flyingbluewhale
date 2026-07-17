import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";

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

const STATE_TONE: Record<string, string> = {
  scheduled: "info",
  conducted: "ok",
  cancelled: "neutral",
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
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const today = rows.filter((r) => new Date(r.scheduled_for) < endOfToday);
  const upcoming = rows.filter((r) => new Date(r.scheduled_for) >= endOfToday);

  const stateLabel = (s: string) =>
    s === "scheduled"
      ? t("m.briefings.state.scheduled", undefined, "Scheduled")
      : s === "conducted"
        ? t("m.briefings.state.conducted", undefined, "Conducted")
        : s === "cancelled"
          ? t("m.briefings.state.cancelled", undefined, "Cancelled")
          : s;

  const renderRow = (r: BriefingRow, withDate: boolean) => (
    <Link key={r.id} href={`/m/briefings/${r.id}`} className="item" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <ShieldCheck size={18} aria-hidden="true" style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{r.topic}</div>
          <div className="s">
            {withDate ? fmt.dateTime(r.scheduled_for) : fmt.time(r.scheduled_for)}
            {r.project?.name ? ` · ${r.project.name}` : ""}
          </div>
        </div>
        <span className={`ps-badge ps-badge--${STATE_TONE[r.briefing_state] ?? "neutral"}`} style={{ flex: "none" }}>
          {stateLabel(r.briefing_state)}
        </span>
      </div>
    </Link>
  );

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.briefings.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.briefings.title", undefined, "Safety Briefings")}
      </h1>

      {rows.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.briefings.empty.title", undefined, "No Briefings This Week")}
          description={t(
            "m.briefings.empty.body",
            undefined,
            "Toolbox talks scheduled for your org show up here. Crew sign in from this screen when the talk runs.",
          )}
        />
      ) : (
        <>
          <div className="scr-eye" style={{ marginBottom: 8 }}>
            {t("m.briefings.today", undefined, "Today")}
          </div>
          {today.length === 0 ? (
            <div className="ps-caption" style={{ color: "var(--p-text-3)", marginBottom: 12 }}>
              {t("m.briefings.noneToday", undefined, "Nothing scheduled today.")}
            </div>
          ) : (
            today.map((r) => renderRow(r, false))
          )}
          {upcoming.length > 0 && (
            <>
              <div className="scr-eye" style={{ marginTop: 16, marginBottom: 8 }}>
                {t("m.briefings.upcoming", undefined, "This Week")}
              </div>
              {upcoming.map((r) => renderRow(r, true))}
            </>
          )}
        </>
      )}
    </div>
  );
}
