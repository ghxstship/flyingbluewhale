import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

const FLEETS_TABLE_ID = "console:transport:fleets";

export const dynamic = "force-dynamic";

function getFleetLabels(
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): Record<string, string> {
  return {
    t1: t("console.transport.fleets.label.t1", undefined, "T1 (VIP)"),
    t2: t("console.transport.fleets.label.t2", undefined, "T2 (Athletes / officials)"),
    t3: t("console.transport.fleets.label.t3", undefined, "T3 (Workforce)"),
    media: t("console.transport.fleets.label.media", undefined, "Media"),
    workforce: t("console.transport.fleets.label.workforce", undefined, "Workforce"),
    spectator: t("console.transport.fleets.label.spectator", undefined, "Spectator"),
  };
}

type RunRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  run_state: string;
  scheduled_depart: string;
};

type VehicleRow = {
  id: string;
  fleet: string;
  fleetLabel: string;
  vehicle: string;
  runCount: number;
  latestDepart: string;
  latestState: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.transport.fleets.eyebrow", undefined, "Transport")}
          title={t("console.transport.fleets.title", undefined, "Fleets")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.transport.fleets.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("dispatch_runs")
    .select("id, fleet, vehicle_ref, run_state, scheduled_depart")
    .eq("org_id", session.orgId)
    .order("scheduled_depart", { ascending: false })
    .limit(500);
  const runs = (data ?? []) as RunRow[];
  const FLEET_LABELS = getFleetLabels(t);

  // Collapse runs into one row per (fleet × vehicle) — the canonical
  // collection is the vehicle, with the fleet a groupable dimension.
  const byVehicle = new Map<string, VehicleRow>();
  for (const r of runs) {
    const vehicle = r.vehicle_ref ?? "—";
    const id = `${r.fleet}::${vehicle}`;
    const existing = byVehicle.get(id);
    if (!existing) {
      byVehicle.set(id, {
        id,
        fleet: r.fleet,
        fleetLabel: FLEET_LABELS[r.fleet] ?? toTitle(r.fleet),
        vehicle,
        runCount: 1,
        latestDepart: r.scheduled_depart,
        latestState: r.run_state,
      });
      continue;
    }
    existing.runCount += 1;
    if (new Date(r.scheduled_depart) > new Date(existing.latestDepart)) {
      existing.latestDepart = r.scheduled_depart;
      existing.latestState = r.run_state;
    }
  }
  const vehicles = Array.from(byVehicle.values()).sort((a, b) => b.runCount - a.runCount);
  const fleetCount = new Set(vehicles.map((v) => v.fleet)).size;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.fleets.eyebrow", undefined, "Transport")}
        title={t("console.transport.fleets.title", undefined, "Fleets")}
        subtitle={`${fleetCount} ${fleetCount === 1 ? t("console.transport.fleets.fleetSingular", undefined, "Fleet") : t("console.transport.fleets.fleetPlural", undefined, "Fleets")} · ${runs.length} ${runs.length === 1 ? t("console.transport.fleets.runSingular", undefined, "run") : t("console.transport.fleets.runPlural", undefined, "runs")} ${t("console.transport.fleets.onFile", undefined, "on file")}`}
        action={
          <Button href="/studio/transport/dispatch/new" size="sm">
            {t("console.transport.fleets.scheduleRun", undefined, "+ Schedule run")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<VehicleRow>
          rows={vehicles}
          tableId={FLEETS_TABLE_ID}
          emptyLabel={t(
            "console.transport.fleets.empty",
            undefined,
            "No dispatch runs yet. Schedule a run from /studio/transport/dispatch to populate fleet data.",
          )}
          columns={[
            {
              key: "fleet",
              header: t("console.transport.fleets.col.fleet", undefined, "Fleet"),
              render: (r) => <Badge variant="muted">{r.fleetLabel}</Badge>,
              accessor: (r) => r.fleetLabel,
              filterable: true,
              groupable: true,
            },
            {
              key: "vehicle",
              header: t("console.transport.fleets.vehicle", undefined, "Vehicle"),
              render: (r) => r.vehicle,
              accessor: (r) => r.vehicle,
              mono: true,
            },
            {
              key: "runs",
              header: t("console.transport.fleets.totalRuns", undefined, "Total runs"),
              render: (r) => r.runCount,
              accessor: (r) => r.runCount,
              tabular: true,
              total: "sum",
            },
            {
              key: "latest",
              header: t("console.transport.fleets.latestRun", undefined, "Latest run"),
              render: (r) =>
                fmt.dateParts(r.latestDepart, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              accessor: (r) => r.latestDepart,
            },
            {
              key: "state",
              header: t("console.transport.fleets.run_state", undefined, "Status"),
              render: (r) => (
                <Badge
                  variant={
                    r.latestState === "in_transit"
                      ? "info"
                      : r.latestState === "arrived"
                        ? "success"
                        : r.latestState === "delayed"
                          ? "warning"
                          : "muted"
                  }
                >
                  {toTitle(r.latestState)}
                </Badge>
              ),
              accessor: (r) => r.latestState,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
