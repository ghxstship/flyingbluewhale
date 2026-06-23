import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type VenueRow = { id: string; name: string };
type LogRow = {
  id: string;
  log_date: string;
  summary: string;
  trades_onsite: number | null;
  blockers: string | null;
  photos: unknown;
};

function photoCount(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.build.eyebrow", undefined, "Venue")}
          title={t("console.venues.build.title", undefined, "Build")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.build.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDay = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  const [{ data: venueData }, { data: logData }] = await Promise.all([
    supabase.from("venues").select("id, name").eq("id", venueId).eq("org_id", session.orgId).maybeSingle(),
    supabase
      .from("venue_build_log")
      .select("id, log_date, summary, trades_onsite, blockers, photos")
      .eq("venue_id", venueId)
      .eq("org_id", session.orgId)
      .order("log_date", { ascending: false })
      .limit(90),
  ]);

  const venue = venueData as VenueRow | null;
  if (!venue) notFound();
  const logs = ((logData ?? []) as unknown as LogRow[]) ?? [];

  const blockers = logs.filter((l) => l.blockers && l.blockers.trim().length > 0).length;
  const totalTrades = logs.reduce((s, l) => s + (l.trades_onsite ?? 0), 0);
  const avgTrades = logs.length > 0 ? Math.round(totalTrades / logs.length) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.build.eyebrow", undefined, "Venue")}
        title={t("console.venues.build.titleWithName", { name: venue.name }, `${venue.name} — Build`)}
        subtitle={
          logs.length === 1
            ? t("console.venues.build.subtitleOne", { count: logs.length }, `${logs.length} log entry`)
            : t("console.venues.build.subtitleOther", { count: logs.length }, `${logs.length} log entries`)
        }
        breadcrumbs={[
          { label: t("console.venues.build.breadcrumbVenues", undefined, "Venues"), href: "/studio/venues" },
          { label: venue.name, href: `/studio/venues/${venue.id}` },
          { label: t("console.venues.build.breadcrumbBuild", undefined, "Build") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.venues.build.metric.daysLogged", undefined, "Days Logged")}
            value={fmt.number(logs.length)}
          />
          <MetricCard
            label={t("console.venues.build.metric.avgTradesDay", undefined, "Avg Trades/Day")}
            value={fmt.number(avgTrades)}
          />
          <MetricCard
            label={t("console.venues.build.metric.daysWithBlockers", undefined, "Days w/ Blockers")}
            value={fmt.number(blockers)}
          />
        </div>

        {logs.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t(
              "console.venues.build.emptyState",
              undefined,
              "No build-log entries yet. The construction lead should add a daily entry summarising trades on site, progress, and blockers — these feed the project's burndown.",
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--p-border)]">
            {logs.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-[var(--p-text-2)]">{fmtDay(l.log_date)}</div>
                    <p className="mt-1 text-sm text-[var(--p-text-1)]">{l.summary}</p>
                    {l.blockers && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--p-warning)]">
                        <AlertTriangle
                          size={12}
                          strokeWidth={2.5}
                          className="mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="sr-only">
                            {t("console.venues.build.blockerSrLabel", undefined, "Blocker: ")}
                          </span>
                          {l.blockers}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-[var(--p-text-2)]">
                    {l.trades_onsite != null && (
                      <span>
                        {t("console.venues.build.tradesCount", { count: l.trades_onsite }, `${l.trades_onsite} trades`)}
                      </span>
                    )}
                    {photoCount(l.photos) > 0 && (
                      <span>
                        {t(
                          "console.venues.build.photosCount",
                          { count: photoCount(l.photos) },
                          `${photoCount(l.photos)} photo(s)`,
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
