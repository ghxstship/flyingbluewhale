import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

function getFleetLabels(
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): Record<string, string> {
  return {
    t1: t("console.transport.fleets.label.t1", undefined, "T1 — VIP"),
    t2: t("console.transport.fleets.label.t2", undefined, "T2 — Athletes / officials"),
    t3: t("console.transport.fleets.label.t3", undefined, "T3 — Workforce"),
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

export default async function Page() {
  const { t } = await getRequestT();
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

  // Group by fleet, then by distinct vehicle_ref within each fleet.
  const fleets = new Map<
    string,
    {
      fleet: string;
      runCount: number;
      vehicles: Map<string, { vehicle: string; runs: RunRow[]; latest: RunRow }>;
    }
  >();
  for (const r of runs) {
    if (!fleets.has(r.fleet)) {
      fleets.set(r.fleet, { fleet: r.fleet, runCount: 0, vehicles: new Map() });
    }
    const f = fleets.get(r.fleet)!;
    f.runCount += 1;
    const vehicleKey = r.vehicle_ref ?? "—";
    if (!f.vehicles.has(vehicleKey)) {
      f.vehicles.set(vehicleKey, { vehicle: vehicleKey, runs: [], latest: r });
    }
    const v = f.vehicles.get(vehicleKey)!;
    v.runs.push(r);
    if (new Date(r.scheduled_depart) > new Date(v.latest.scheduled_depart)) {
      v.latest = r;
    }
  }
  const sorted = Array.from(fleets.values()).sort((a, b) => b.runCount - a.runCount);
  const FLEET_LABELS = getFleetLabels(t);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.fleets.eyebrow", undefined, "Transport")}
        title={t("console.transport.fleets.title", undefined, "Fleets")}
        subtitle={`${sorted.length} ${sorted.length === 1 ? t("console.transport.fleets.fleetSingular", undefined, "Fleet") : t("console.transport.fleets.fleetPlural", undefined, "Fleets")} · ${runs.length} ${runs.length === 1 ? t("console.transport.fleets.runSingular", undefined, "run") : t("console.transport.fleets.runPlural", undefined, "runs")} ${t("console.transport.fleets.onFile", undefined, "on file")}`}
        action={
          <Button href="/console/transport/dispatch/new" size="sm">
            {t("console.transport.fleets.scheduleRun", undefined, "+ Schedule run")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {sorted.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--p-text-2)]">
            {t(
              "console.transport.fleets.empty",
              undefined,
              "No dispatch runs yet. Schedule a run from /console/transport/dispatch to populate fleet data.",
            )}
          </div>
        ) : (
          sorted.map((f) => (
            <section key={f.fleet} className="surface">
              <header className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">{FLEET_LABELS[f.fleet] ?? f.fleet}</h3>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">
                    {f.vehicles.size}{" "}
                    {f.vehicles.size === 1
                      ? t("console.transport.fleets.vehicleSingular", undefined, "vehicle")
                      : t("console.transport.fleets.vehiclePlural", undefined, "vehicles")}{" "}
                    · {f.runCount}{" "}
                    {f.runCount === 1
                      ? t("console.transport.fleets.runSingular", undefined, "run")
                      : t("console.transport.fleets.runPlural", undefined, "runs")}
                  </div>
                </div>
                <Badge variant="muted">{toTitle(f.fleet)}</Badge>
              </header>
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.transport.fleets.vehicle", undefined, "Vehicle")}</th>
                    <th>{t("console.transport.fleets.totalRuns", undefined, "Total runs")}</th>
                    <th>{t("console.transport.fleets.latestRun", undefined, "Latest run")}</th>
                    <th>{t("console.transport.fleets.run_state", undefined, "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(f.vehicles.values())
                    .sort((a, b) => b.runs.length - a.runs.length)
                    .map((v) => (
                      <tr key={v.vehicle}>
                        <td className="font-mono text-xs">{v.vehicle}</td>
                        <td className="font-mono text-xs">{v.runs.length}</td>
                        <td className="font-mono text-xs">
                          {new Date(v.latest.scheduled_depart).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>
                          <Badge
                            variant={
                              v.latest.run_state === "in_transit"
                                ? "info"
                                : v.latest.run_state === "arrived"
                                  ? "success"
                                  : v.latest.run_state === "delayed"
                                    ? "warning"
                                    : "muted"
                            }
                          >
                            {toTitle(v.latest.run_state)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </>
  );
}
