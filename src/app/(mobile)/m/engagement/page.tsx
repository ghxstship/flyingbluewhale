import Link from "next/link";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

/**
 * COMPVSS · Engagement — kit 28 `engagement` (/m/engagement).
 *
 * "Reach & adoption analytics (perm: reports). Stat tiles + weekly sparkline
 * + AI Ops summary." The kit's `reports` perm maps to the manager band here
 * (the same proxy every reports surface uses until per-capability grants
 * carry a reports scope).
 *
 * Every number is a real 7-day org read: crew who punched, messages posted,
 * scans recorded, incidents filed. The summary line is DERIVED from those
 * numbers — the kit calls it an "AI Ops summary", but shipping a canned
 * sentence dressed as AI would be a placebo; this states the facts it can
 * prove and nothing else.
 */
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function EngagementPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.engagement.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  if (!isManagerPlus(session)) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.engagement.eyebrow", undefined, "Analytics")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.engagement.title", undefined, "Engagement")}
        </h1>
        <EmptyState
          size="compact"
          title={t("m.engagement.gated.title", undefined, "Manager Access Only")}
          description={t(
            "m.engagement.gated.body",
            undefined,
            "Reach and adoption analytics are a reports surface. Ask a manager if you need these numbers.",
          )}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * DAY_MS).toISOString();

  const [punchRes, msgRes, scanRes, incidentRes] = await Promise.all([
    supabase
      .from("time_entries")
      .select("user_id, started_at")
      .eq("org_id", session.orgId)
      .gte("started_at", since)
      .limit(2000),
    supabase
      .from("chat_messages")
      .select("id, created_at")
      .eq("org_id", session.orgId)
      .gte("created_at", since)
      .limit(5000),
    supabase
      .from("assignment_events")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("event_kind", "scan")
      .gte("created_at", since),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("created_at", since),
  ]);

  const punches = (punchRes.data ?? []) as Array<{ user_id: string | null; started_at: string }>;
  const activeCrew = new Set(punches.map((p) => p.user_id).filter(Boolean)).size;
  const messages = (msgRes.data ?? []) as Array<{ id: string; created_at: string }>;
  const scans = scanRes.count ?? 0;
  const incidents = incidentRes.count ?? 0;

  // Messages per day, oldest → newest — the weekly sparkline series.
  const days: number[] = Array.from({ length: 7 }, () => 0);
  const now = Date.now();
  for (const m of messages) {
    const age = Math.floor((now - new Date(m.created_at).getTime()) / DAY_MS);
    if (age >= 0 && age < 7) days[6 - age] = (days[6 - age] ?? 0) + 1;
  }
  const peak = Math.max(1, ...days);
  const W = 280;
  const H = 48;
  const points = days.map((v, i) => `${(i * (W / 6)).toFixed(1)},${(H - 4 - (v / peak) * (H - 8)).toFixed(1)}`).join(" ");

  const tiles: Array<{ icon: string; label: string; value: number; sub: string }> = [
    {
      icon: "Timer",
      label: t("m.engagement.activeCrew", undefined, "Active Crew"),
      value: activeCrew,
      sub: t("m.engagement.punchedThisWeek", undefined, "Punched This Week"),
    },
    {
      icon: "MessageSquare",
      label: t("m.engagement.messages", undefined, "Messages"),
      value: messages.length,
      sub: t("m.engagement.last7", undefined, "Last 7 Days"),
    },
    {
      icon: "ScanLine",
      label: t("m.engagement.scans", undefined, "Scans"),
      value: scans,
      sub: t("m.engagement.last7", undefined, "Last 7 Days"),
    },
    {
      icon: "TriangleAlert",
      label: t("m.engagement.incidents", undefined, "Incidents"),
      value: incidents,
      sub: t("m.engagement.last7", undefined, "Last 7 Days"),
    },
  ];

  // Derived, not generated: state the strongest true facts in one line.
  const summary = t(
    "m.engagement.summary",
    { crew: activeCrew, msgs: messages.length, scans },
    `${activeCrew} crew punched in this week, posting ${messages.length} messages; ${scans} scans went through the gates.`,
  );

  return (
    <div className="screen screen-anim">
      <Link href="/m/more" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.more.title", undefined, "More")}
      </Link>
      <div className="scr-eye">{t("m.engagement.eyebrow", undefined, "Reach & Adoption · 7 Days")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.engagement.title", undefined, "Engagement")}
      </h1>

      <div className="widgets">
        {tiles.map((tile) => (
          <div className="w" key={tile.label}>
            <div className="wtop">
              <span
                className="wic"
                style={{
                  background: "color-mix(in oklab, var(--p-accent) 16%, transparent)",
                  color: "var(--p-accent-text)",
                }}
              >
                <KIcon name={tile.icon} size={19} />
              </span>
            </div>
            <div className="wl">{tile.label}</div>
            <div className="wv">{tile.value}</div>
            <div className="wsub">{tile.sub}</div>
          </div>
        ))}
      </div>

      <div className="sech">
        <h2>{t("m.engagement.weekly", undefined, "Messages · Daily")}</h2>
      </div>
      <div className="item" style={{ display: "block" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 48 }} role="img" aria-label={summary}>
          <polyline
            points={points}
            fill="none"
            stroke="var(--p-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="sech">
        <h2>{t("m.engagement.opsSummary", undefined, "Ops Summary")}</h2>
      </div>
      <div className="item" style={{ display: "block" }}>
        <div className="s">{summary}</div>
      </div>
    </div>
  );
}
