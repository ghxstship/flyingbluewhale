import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { LiveDispatchMap, type DispatchPoint } from "./LiveDispatchMap";

export const dynamic = "force-dynamic";

/**
 * Live dispatch — every active run plotted via origin/destination venues
 * (which carry lat/lng through the locations table). Read-only for the
 * MVP; the moment a vehicle gets a GPS device it streams here.
 */
export default async function LiveDispatchPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Live dispatch" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Pull active runs joined to origin + destination venues + their locations.
  const { data: runs } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, status, scheduled_depart, scheduled_arrive, actual_depart, actual_arrive, " +
        "origin:origin_venue_id(name, locations(lat, lng)), " +
        "destination:destination_venue_id(name, locations(lat, lng))",
    )
    .eq("org_id", session.orgId)
    .order("scheduled_depart", { ascending: false })
    .limit(50);

  type DispatchRunRow = {
    id: string;
    fleet: string | null;
    vehicle_ref: string | null;
    status: string | null;
    scheduled_depart: string;
    scheduled_arrive: string | null;
    actual_depart: string | null;
    actual_arrive: string | null;
    origin: { name?: string; locations?: { lat?: number | null; lng?: number | null } | null } | null;
    destination: {
      name?: string;
      locations?: { lat?: number | null; lng?: number | null } | null;
    } | null;
  };

  const points: DispatchPoint[] = ((runs as DispatchRunRow[] | null) ?? [])
    .filter((r) => {
      const olat = r.origin?.locations?.lat;
      const olng = r.origin?.locations?.lng;
      const dlat = r.destination?.locations?.lat;
      const dlng = r.destination?.locations?.lng;
      return olat != null && olng != null && dlat != null && dlng != null;
    })
    .map((r) => ({
      id: r.id,
      vehicle: r.vehicle_ref ?? r.fleet ?? "—",
      status: r.status ?? "scheduled",
      origin: {
        name: r.origin?.name ?? "—",
        lat: r.origin!.locations!.lat as number,
        lng: r.origin!.locations!.lng as number,
      },
      destination: {
        name: r.destination?.name ?? "—",
        lat: r.destination!.locations!.lat as number,
        lng: r.destination!.locations!.lng as number,
      },
      scheduledDepart: r.scheduled_depart,
      scheduledArrive: r.scheduled_arrive ?? null,
      actualDepart: r.actual_depart ?? null,
      actualArrive: r.actual_arrive ?? null,
    }));

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Live dispatch"
        subtitle={`${points.length} run${points.length === 1 ? "" : "s"} with a fix`}
      />
      <div className="page-content space-y-5">
        <LiveDispatchMap points={points} />

        <section className="surface overflow-x-auto">
          <header className="border-b border-[var(--border-color)] px-4 py-2.5">
            <h3 className="text-sm font-semibold">Active runs</h3>
          </header>
          {points.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              No dispatch runs with origin/destination coordinates. Add lat/lng on venues to see them here.
            </p>
          ) : (
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Departed</th>
                  <th>Arrived</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.vehicle}</td>
                    <td>{p.origin.name}</td>
                    <td>{p.destination.name}</td>
                    <td>
                      <Badge
                        variant={
                          p.status === "in_transit"
                            ? "info"
                            : p.status === "arrived"
                              ? "success"
                              : p.status === "delayed"
                                ? "warning"
                                : "muted"
                        }
                      >
                        {p.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs">
                      {p.actualDepart
                        ? new Date(p.actualDepart).toLocaleTimeString()
                        : new Date(p.scheduledDepart).toLocaleTimeString()}
                    </td>
                    <td className="font-mono text-xs">
                      {p.actualArrive
                        ? new Date(p.actualArrive).toLocaleTimeString()
                        : p.scheduledArrive
                          ? new Date(p.scheduledArrive).toLocaleTimeString()
                          : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
