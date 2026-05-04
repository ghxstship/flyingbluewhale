import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
  handover_state: string;
};

const COMPOUND_KINDS = ["ibc", "mpc"] as const;

const KIND_LABEL: Record<string, string> = {
  ibc: "IBC · International Broadcast Centre",
  mpc: "MPC · Main Press Centre",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Compounds" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("venues")
    .select("id, name, kind, cluster, capacity, handover_state")
    .eq("org_id", session.orgId)
    .in("kind", [...COMPOUND_KINDS])
    .order("name", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as VenueRow[];

  // Aggregate by kind
  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Compounds"
        subtitle={`${rows.length} compound${rows.length === 1 ? "" : "s"} (${COMPOUND_KINDS.map((k) => `${byKind[k] ?? 0} ${k.toUpperCase()}`).join(" · ")})`}
        action={
          <Button href="/console/venues/new" size="sm">
            + New Venue
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {Object.keys(byKind).length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">By Kind</h3>
            <ul className="mt-3 space-y-1.5">
              {COMPOUND_KINDS.map((k) => (
                <li key={k} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{KIND_LABEL[k] ?? k}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{byKind[k] ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<VenueRow>
          rows={rows}
          rowHref={(r) => `/console/venues/${r.id}`}
          emptyLabel="No broadcast compounds"
          emptyDescription="Broadcast compounds (IBC + MPC) are venues with kind 'ibc' or 'mpc'. Author one through Venues → New, then set its kind."
          emptyAction={
            <Button href="/console/venues/new" size="sm">
              + New Venue
            </Button>
          }
          columns={[
            { key: "name", header: "Name", render: (r) => r.name, accessor: (r) => r.name },
            {
              key: "kind",
              header: "Kind",
              render: (r) => r.kind.toUpperCase(),
              className: "font-mono text-xs",
              filterable: true,
              groupable: true,
              accessor: (r) => r.kind.toUpperCase ?? null,
            },
            { key: "cluster", header: "Cluster", render: (r) => r.cluster ?? "—", accessor: (r) => r.cluster ?? null },
            {
              key: "capacity",
              header: "Capacity",
              render: (r) => (
                <span className="font-mono text-xs">{r.capacity != null ? fmt.number(r.capacity) : "—"}</span>
              ),
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "handover",
              header: "Handover",
              render: (r) => <StatusBadge status={r.handover_state} />,
              accessor: (r) => r.handover_state,
            },
          ]}
        />

        <p className="text-xs text-[var(--text-muted)]">
          Cable plant + signal flow diagrams attach to each venue's stage-plot record. Open a compound to author its
          rigging plan and rights-holder allocation.
        </p>
      </div>
    </>
  );
}
