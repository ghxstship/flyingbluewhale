import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ScanEvent = {
  location: string | null;
  result: string | null;
  at: string;
};

type LocationCount = {
  id: string;
  location: string;
  accepted: number;
  rejected: number;
  lastScan: string;
};

/**
 * Crowd Counts (kit 20 Safety · Protect tab) — live occupancy derived from
 * the append-only scan journal (`assignment_events`, event_kind=scan).
 * Accepted scans per checkpoint over the last 24h approximate zone
 * occupancy; rejects surface gate friction. No parallel counter store —
 * the journal is the truth (advancing canon 0061).
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.crowdCounts.eyebrow", undefined, "Safety · Protect")}
          title={t("console.crowdCounts.title", undefined, "Crowd Counts")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.crowdCounts.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("assignment_events")
    .select("location, result, at")
    .eq("org_id", session.orgId)
    .eq("event_kind", "scan")
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(2000);

  const events = (data ?? []) as unknown as ScanEvent[];
  const byLocation = new Map<string, LocationCount>();
  for (const e of events) {
    const key = e.location ?? "Unassigned Checkpoint";
    const bucket = byLocation.get(key) ?? { id: key, location: key, accepted: 0, rejected: 0, lastScan: e.at };
    if (e.result === "accepted") bucket.accepted += 1;
    else bucket.rejected += 1;
    if (e.at > bucket.lastScan) bucket.lastScan = e.at;
    byLocation.set(key, bucket);
  }
  const rows = [...byLocation.values()].sort((a, b) => b.accepted - a.accepted);
  const totalAccepted = rows.reduce((n, r) => n + r.accepted, 0);
  const totalRejected = rows.reduce((n, r) => n + r.rejected, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.crowdCounts.eyebrow", undefined, "Safety · Protect")}
        title={t("console.crowdCounts.title", undefined, "Crowd Counts")}
        subtitle={t(
          "console.crowdCounts.subtitle",
          undefined,
          "Occupancy from the scan journal, per checkpoint, last 24 hours.",
        )}
        action={
          <Button href="/studio/access-control" size="sm" variant="secondary">
            {t("console.crowdCounts.openScanner", undefined, "Open Checkpoints")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.crowdCounts.metric.scansIn", undefined, "Accepted Scans")}
            value={fmt.number(totalAccepted)}
            accent
          />
          <MetricCard
            label={t("console.crowdCounts.metric.rejected", undefined, "Rejected Scans")}
            value={fmt.number(totalRejected)}
          />
          <MetricCard
            label={t("console.crowdCounts.metric.checkpoints", undefined, "Active Checkpoints")}
            value={fmt.number(rows.length)}
          />
        </div>
        <DataView<LocationCount>
          rows={rows}
          emptyLabel={t("console.crowdCounts.emptyLabel", undefined, "No scans in the last 24 hours")}
          emptyDescription={t(
            "console.crowdCounts.emptyDescription",
            undefined,
            "Gate scans land here live once checkpoints start scanning credentials and tickets.",
          )}
          emptyAction={
            <Button href="/studio/access-control" size="sm">
              {t("console.crowdCounts.openScanner", undefined, "Open Checkpoints")}
            </Button>
          }
          columns={[
            {
              key: "location",
              header: t("console.crowdCounts.column.checkpoint", undefined, "Checkpoint"),
              render: (r) => r.location,
              accessor: (r) => r.location,
            },
            {
              key: "accepted",
              header: t("console.crowdCounts.column.accepted", undefined, "Accepted"),
              render: (r) => fmt.number(r.accepted),
              mono: true,
              accessor: (r) => r.accepted,
            },
            {
              key: "rejected",
              header: t("console.crowdCounts.column.rejected", undefined, "Rejected"),
              render: (r) => fmt.number(r.rejected),
              mono: true,
              accessor: (r) => r.rejected,
            },
            {
              key: "last",
              header: t("console.crowdCounts.column.last", undefined, "Last Scan"),
              render: (r) => fmt.relative(r.lastScan),
              mono: true,
              accessor: (r) => r.lastScan,
            },
          ]}
        />
      </div>
    </>
  );
}
