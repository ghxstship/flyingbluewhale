import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function photoCount(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

export default async function Page({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Venue" title="Build" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

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
        eyebrow="Venue"
        title={`${venue.name} — Build`}
        subtitle={`${logs.length} log entr${logs.length === 1 ? "y" : "ies"}`}
        breadcrumbs={[
          { label: "Venues", href: "/console/venues" },
          { label: venue.name, href: `/console/venues/${venue.id}` },
          { label: "Build" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Days Logged" value={logs.length.toLocaleString()} />
          <MetricCard label="Avg Trades/Day" value={avgTrades.toLocaleString()} />
          <MetricCard label="Days w/ Blockers" value={blockers.toLocaleString()} />
        </div>

        {logs.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            No build-log entries yet. The construction lead should add a daily entry summarising trades on site,
            progress, and blockers — these feed the project's burndown.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {logs.map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-[var(--text-muted)]">{fmtDay(l.log_date)}</div>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{l.summary}</p>
                    {l.blockers && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--color-warning)]">
                        <AlertTriangle
                          size={12}
                          strokeWidth={2.5}
                          className="mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="sr-only">Blocker: </span>
                          {l.blockers}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-[var(--text-muted)]">
                    {l.trades_onsite != null && <span>{l.trades_onsite} trades</span>}
                    {photoCount(l.photos) > 0 && <span>{photoCount(l.photos)} photo(s)</span>}
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
