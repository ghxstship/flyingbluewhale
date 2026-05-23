import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const FLEET_LABELS: Record<string, string> = {
  t1: "T1 — VIP",
  t2: "T2 — Athletes / officials",
  t3: "T3 — Workforce",
  media: "Media",
  workforce: "Workforce",
  spectator: "Spectator",
};

type RunRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Transport" title="Fleets" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("dispatch_runs")
    .select("id, fleet, vehicle_ref, status, scheduled_depart")
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

  return (
    <>
      <ModuleHeader
        eyebrow="Transport"
        title="Fleets"
        subtitle={`${sorted.length} Fleet${sorted.length === 1 ? "" : "s"} · ${runs.length} run${runs.length === 1 ? "" : "s"} on file`}
        action={
          <Button href="/console/transport/dispatch/new" size="sm">
            + Schedule run
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {sorted.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--text-muted)]">
            No dispatch runs yet. Schedule a run from /console/transport/dispatch to populate fleet data.
          </div>
        ) : (
          sorted.map((f) => (
            <section key={f.fleet} className="surface">
              <header className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold">{FLEET_LABELS[f.fleet] ?? f.fleet}</h3>
                  <div className="font-mono text-xs text-[var(--text-muted)]">
                    {f.vehicles.size} vehicle{f.vehicles.size === 1 ? "" : "s"} · {f.runCount} run
                    {f.runCount === 1 ? "" : "s"}
                  </div>
                </div>
                <Badge variant="muted">{toTitle(f.fleet)}</Badge>
              </header>
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Total runs</th>
                    <th>Latest run</th>
                    <th>Status</th>
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
                              v.latest.status === "in_transit"
                                ? "info"
                                : v.latest.status === "arrived"
                                  ? "success"
                                  : v.latest.status === "delayed"
                                    ? "warning"
                                    : "muted"
                            }
                          >
                            {v.latest.status.replace("_", " ")}
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
