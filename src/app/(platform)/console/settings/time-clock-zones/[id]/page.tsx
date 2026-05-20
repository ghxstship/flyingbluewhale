import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { archiveZone, reactivateZone } from "./actions";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();

  const { data } = await supabase
    .from("time_clock_zones")
    .select("id, name, center_lat, center_lng, radius_m, lifecycle_state, project_id")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const z = data as {
    id: string;
    name: string;
    center_lat: number;
    center_lng: number;
    radius_m: number;
    lifecycle_state: string;
    project_id: string | null;
  };

  // Recent punches in this zone — surface outside-the-zone punches first
  // so admins can audit suspicious attempts.
  const { data: punches } = await supabase
    .from("time_entries")
    .select("id, user_id, started_at, geofence_state, punch_lat, punch_lng")
    .eq("org_id", session.orgId)
    .eq("zone_id", id)
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <>
      <ModuleHeader
        eyebrow="Time-Clock Zone"
        title={z.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={z.lifecycle_state === "active" ? "success" : "muted"}>{z.lifecycle_state}</Badge>
            <span className="font-mono text-xs">
              {z.center_lat.toFixed(5)}, {z.center_lng.toFixed(5)} · {z.radius_m} m
            </span>
          </span>
        }
        action={
          z.lifecycle_state === "active" ? (
            <form action={archiveZone}>
              <input type="hidden" name="id" value={z.id} />
              <button type="submit" className="btn btn-secondary btn-sm">
                Archive
              </button>
            </form>
          ) : (
            <form action={reactivateZone}>
              <input type="hidden" name="id" value={z.id} />
              <button type="submit" className="btn btn-primary btn-sm">
                Reactivate
              </button>
            </form>
          )
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Recent Punches</h2>
          {(
            (punches ?? []) as Array<{
              id: string;
              user_id: string;
              started_at: string;
              geofence_state: string;
              punch_lat: number | null;
              punch_lng: number | null;
            }>
          ).length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No punches recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(
                (punches ?? []) as Array<{
                  id: string;
                  user_id: string;
                  started_at: string;
                  geofence_state: string;
                  punch_lat: number | null;
                  punch_lng: number | null;
                }>
              ).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono">{fmtIntl.dateTime(p.started_at)}</span>
                  <span className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.geofence_state === "inside" ? "success" : p.geofence_state === "outside" ? "warning" : "muted"
                      }
                    >
                      {p.geofence_state}
                    </Badge>
                    {p.punch_lat != null && p.punch_lng != null && (
                      <span className="font-mono">
                        {p.punch_lat.toFixed(4)}, {p.punch_lng.toFixed(4)}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
