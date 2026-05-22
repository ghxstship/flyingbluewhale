import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type VenueRow = {
  id: string;
  name: string;
  kind: string;
  cluster: string | null;
  capacity: number | null;
  metadata: unknown;
};

type PlaybookRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  version: number;
};

const KINDS_REQUIRING_MED = ["competition", "training", "live_site", "village"] as const;

function readMedicalCapacity(metadata: unknown): { tier?: string; cot_count?: number } | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  const med = (m.medical ?? m.med) as Record<string, unknown> | undefined;
  if (!med) return null;
  const tier = typeof med.tier === "string" ? (med.tier as string) : undefined;
  const cot = typeof med.cot_count === "number" ? (med.cot_count as number) : undefined;
  return tier || cot != null ? { tier, cot_count: cot } : null;
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Medical Plan" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: venuesData }, { data: playbookData }] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, kind, cluster, capacity, metadata")
      .eq("org_id", session.orgId)
      .in("kind", [...KINDS_REQUIRING_MED])
      .order("cluster", { ascending: true })
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("playbooks")
      .select("id, slug, title, status, version")
      .eq("org_id", session.orgId)
      .eq("kind", "safety")
      .ilike("title", "%medical%")
      .order("title", { ascending: true })
      .limit(20),
  ]);

  const venues = (venuesData ?? []) as VenueRow[];
  const playbooks = (playbookData ?? []) as PlaybookRow[];

  const covered = venues.filter((v) => readMedicalCapacity(v.metadata) != null).length;
  const coveragePct = venues.length > 0 ? Math.round((covered / venues.length) * 100) : null;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Medical Plan"
        subtitle={`${venues.length} venue${venues.length === 1 ? "" : "s"} · ${covered} have medical capacity recorded${coveragePct != null ? ` · ${coveragePct}% coverage` : ""}`}
        action={
          <Button href="/console/safety/playbooks/new" size="sm">
            + New Plan
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <section>
          <h3 className="text-sm font-semibold">Venues Requiring Medical Cover</h3>
          {venues.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Competition / Training / Village Venues Yet"
              description="Author venues in Console → Venues. Each venue's medical capacity is captured under metadata.medical."
            />
          ) : (
            <div className="surface mt-3 overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>Kind</th>
                    <th>Cluster</th>
                    <th>Capacity</th>
                    <th>Med tier</th>
                    <th>Cots</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map((v) => {
                    const med = readMedicalCapacity(v.metadata);
                    return (
                      <tr key={v.id}>
                        <td>
                          <Link
                            href={`/console/venues/${v.id}`}
                            className="font-medium hover:text-[var(--org-primary)]"
                          >
                            {v.name}
                          </Link>
                        </td>
                        <td>
                          <Badge variant="muted">{v.kind}</Badge>
                        </td>
                        <td>{v.cluster ?? "—"}</td>
                        <td className="font-mono text-xs">{v.capacity != null ? fmt.number(v.capacity) : "—"}</td>
                        <td>
                          {med?.tier ? (
                            <Badge variant="info">{med.tier}</Badge>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="font-mono text-xs">{med?.cot_count ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">Medical Playbooks</h3>
          <ul className="mt-3 space-y-2">
            {playbooks.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title="No Medical Playbooks Authored"
                  description="Author safety playbooks tagged with 'medical' to surface them here."
                  action={
                    <Button href="/console/safety/playbooks/new" variant="secondary" size="sm">
                      + New Plan
                    </Button>
                  }
                />
              </li>
            ) : (
              playbooks.map((p) => (
                <li key={p.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <Link
                      href={`/console/safety/playbooks/${p.slug}`}
                      className="text-sm font-medium hover:text-[var(--org-primary)]"
                    >
                      {p.title}
                    </Link>
                    <div className="font-mono text-xs text-[var(--text-muted)]">v{p.version}</div>
                  </div>
                  <Badge variant={p.status === "published" ? "success" : "muted"}>{p.status}</Badge>
                </li>
              ))
            )}
          </ul>
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Roll-up of capacity by venue plus authoritative playbooks. Author granular tier / cot counts via the venue
          metadata editor; author response procedures as Safety playbooks tagged with 'medical'.
        </p>
      </div>
    </>
  );
}
