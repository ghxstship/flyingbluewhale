import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

const WORKFORCE_TABLE_ID = "console:transport:workforce";

type RunRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  origin: { name: string | null } | null;
  destination: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.transport.workforce.eyebrow", undefined, "Transport")}
          title={t("console.transport.workforce.title", undefined, "Workforce Shuttles")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.transport.workforce.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const fmtDay = (d: Date): string => fmt.dateParts(d, { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (iso: string): string => fmt.time(iso);
  // Window: today + next 3 days. Filter by workforce + spectator fleets
  // (the fleets that move crew + workforce, not VIPs/athletes).
  const today = new Date();
  const startOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);

  const { data } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, status:run_state, scheduled_depart, scheduled_arrive, " +
        "origin:origin_venue_id(name), destination:destination_venue_id(name)",
    )
    .eq("org_id", session.orgId)
    .in("fleet", ["workforce", "t3", "spectator"])
    .gte("scheduled_depart", startOfWindow.toISOString())
    .lt("scheduled_depart", endOfWindow.toISOString())
    .order("scheduled_depart", { ascending: true });
  const runs = (data ?? []) as unknown as RunRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.workforce.eyebrow", undefined, "Transport")}
        title={t("console.transport.workforce.title", undefined, "Workforce Shuttles")}
        subtitle={
          runs.length === 1
            ? t(
                "console.transport.workforce.subtitleOne",
                { count: runs.length },
                `${runs.length} Run Across Workforce + T3 + spectator fleets, next 3 days`,
              )
            : t(
                "console.transport.workforce.subtitleOther",
                { count: runs.length },
                `${runs.length} Runs Across Workforce + T3 + spectator fleets, next 3 days`,
              )
        }
        action={
          <Button href="/studio/transport/dispatch/new" size="sm">
            {t("console.transport.workforce.scheduleRun", undefined, "+ Schedule run")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<RunRow>
          rows={runs}
          tableId={WORKFORCE_TABLE_ID}
          emptyLabel={t("console.transport.workforce.empty.title", undefined, "No Workforce Shuttles Scheduled")}
          emptyDescription={t(
            "console.transport.workforce.empty.description",
            undefined,
            "Workforce shuttles are dispatch_runs with fleet ∈ {workforce, t3, spectator}. Schedule a run from /studio/transport/dispatch.",
          )}
          emptyAction={
            <Button href="/studio/transport/dispatch/new" size="sm">
              {t("console.transport.workforce.scheduleRun", undefined, "+ Schedule run")}
            </Button>
          }
          columns={[
            {
              key: "day",
              header: t("console.transport.workforce.col.day", undefined, "Day"),
              render: (r) => fmtDay(new Date(r.scheduled_depart)),
              accessor: (r) => new Date(r.scheduled_depart).toDateString(),
              groupable: true,
              filterable: true,
            },
            {
              key: "depart",
              header: t("console.transport.workforce.col.depart", undefined, "Depart"),
              render: (r) => fmtTime(r.scheduled_depart),
              accessor: (r) => r.scheduled_depart,
              mono: true,
            },
            {
              key: "arrive",
              header: t("console.transport.workforce.col.arrive", undefined, "Arrive"),
              render: (r) => (r.scheduled_arrive ? fmtTime(r.scheduled_arrive) : "—"),
              accessor: (r) => r.scheduled_arrive ?? null,
              mono: true,
            },
            {
              key: "from",
              header: t("console.transport.workforce.col.from", undefined, "From"),
              render: (r) => r.origin?.name ?? "—",
              accessor: (r) => r.origin?.name ?? null,
            },
            {
              key: "to",
              header: t("console.transport.workforce.col.to", undefined, "To"),
              render: (r) => r.destination?.name ?? "—",
              accessor: (r) => r.destination?.name ?? null,
            },
            {
              key: "fleet",
              header: t("console.transport.workforce.col.fleet", undefined, "Fleet"),
              render: (r) => <Badge variant="muted">{toTitle(r.fleet)}</Badge>,
              accessor: (r) => r.fleet,
              filterable: true,
            },
            {
              key: "vehicle",
              header: t("console.transport.workforce.col.vehicle", undefined, "Vehicle"),
              render: (r) => r.vehicle_ref ?? "—",
              accessor: (r) => r.vehicle_ref ?? null,
              mono: true,
            },
            {
              key: "status",
              header: t("console.transport.workforce.col.status", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
