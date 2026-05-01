import Link from "next/link";
import { MapPin, Compass } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type VenueRow = {
  id: string;
  name: string;
  kind: string;
  cluster: string | null;
  capacity: number | null;
};

const KIND_TONE: Record<string, "muted" | "info" | "success"> = {
  competition: "info",
  training: "muted",
  ibc: "info",
  mpc: "info",
  village: "success",
  live_site: "muted",
  support: "muted",
};

export default async function MobileWayfindPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("venues")
    .select("id, name, kind, cluster, capacity")
    .eq("org_id", session.orgId)
    .order("cluster", { ascending: true })
    .order("name", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as VenueRow[];

  // Group by cluster
  const byCluster = rows.reduce<Map<string, VenueRow[]>>((map, v) => {
    const key = v.cluster ?? "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
    return map;
  }, new Map());
  const clusters = Array.from(byCluster.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Wayfinding</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Pick a venue to view its zones, gates, and meet-points.</p>

      {clusters.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            size="compact"
            title="No venues yet"
            description="Author venues from Console → Venues. Each venue's zones become the routable points here."
            action={
              <Link href="/console/venues" className="btn btn-secondary btn-sm">
                Open Venues
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {clusters.map(([cluster, list]) => (
            <section key={cluster}>
              <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                <Compass className="mr-1 inline-block" size={12} /> {cluster}
              </h2>
              <ul className="mt-2 space-y-2">
                {list.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/console/venues/${v.id}`}
                      className="surface-raised flex items-center justify-between p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <MapPin size={14} className="text-[var(--text-muted)]" />
                          {v.name}
                        </div>
                        {v.capacity != null && (
                          <div className="mt-0.5 ml-5 font-mono text-xs text-[var(--text-muted)]">
                            cap {v.capacity.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Badge variant={KIND_TONE[v.kind] ?? "muted"}>{v.kind}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
