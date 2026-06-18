import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();

  let scheduledEvents: number | null = null;
  let openRisks: number | null = null;
  let programReviews: number | null = null;
  let readinessExercises: number | null = null;

  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const horizon = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const [events, risks, reviews, readiness] = await Promise.all([
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .lte("starts_at", horizon),
      supabase
        .from("risks")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .neq("risk_state", "closed"),
      supabase
        .from("program_reviews")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId),
      supabase
        .from("readiness_exercises")
        .select("*", { count: "exact", head: true })
        .eq("org_id", session.orgId),
    ]);

    scheduledEvents = events.count ?? 0;
    openRisks = risks.count ?? 0;
    programReviews = reviews.count ?? 0;
    readinessExercises = readiness.count ?? 0;
  }

  const fmt = await getRequestFormatters();
  const metric = (n: number | null) => (n === null ? "—" : fmt.number(n));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.eyebrow", undefined, "Programs")}
        title={t("console.programs.title", undefined, "Programs")}
        subtitle={t(
          "console.programs.subtitle",
          undefined,
          "Master schedule, risk, reviews, and readiness across the program.",
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.programs.metrics.scheduledEvents", undefined, "Scheduled Events")}
            value={metric(scheduledEvents)}
            accent
          />
          <MetricCard
            label={t("console.programs.metrics.openRisks", undefined, "Open Risks")}
            value={metric(openRisks)}
          />
          <MetricCard
            label={t("console.programs.metrics.reviews", undefined, "Program Reviews")}
            value={metric(programReviews)}
          />
          <MetricCard
            label={t("console.programs.metrics.readiness", undefined, "Readiness Exercises")}
            value={metric(readinessExercises)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/programs/schedule">
            <div className="text-sm font-medium">{t("console.programs.scheduleLabel", undefined, "Master schedule")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/risk">
            <div className="text-sm font-medium">{t("console.programs.riskLabel", undefined, "Risk register")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/reviews">
            <div className="text-sm font-medium">{t("console.programs.reviewsLabel", undefined, "Reviews")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/readiness">
            <div className="text-sm font-medium">{t("console.programs.readinessLabel", undefined, "Readiness")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/scope">
            <div className="text-sm font-medium">{t("console.programs.scopeLabel", undefined, "Scope")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/sessions">
            <div className="text-sm font-medium">{t("console.programs.sessionsLabel", undefined, "Sessions")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/ceremonies">
            <div className="text-sm font-medium">{t("console.programs.ceremoniesLabel", undefined, "Ceremonies")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/protocol">
            <div className="text-sm font-medium">{t("console.programs.protocolLabel", undefined, "Protocol")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/pressconf">
            <div className="text-sm font-medium">{t("console.programs.pressconfLabel", undefined, "Press conferences")}</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/programs/cases">
            <div className="text-sm font-medium">{t("console.programs.casesLabel", undefined, "Cases")}</div>
          </Link>
        </div>
      </div>
    </>
  );
}
