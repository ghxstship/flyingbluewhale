import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { BeoState } from "@/lib/beos";

export const dynamic = "force-dynamic";

type BeoRow = {
  id: string;
  beo_number: string | null;
  event_name: string;
  event_date: string | null;
  space: string | null;
  headcount: number;
  beo_state: BeoState;
  created_at: string;
};

export default async function BeosPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="BEOs" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("beos", session.orgId, {
    orderBy: "event_date",
  })) as unknown as BeoRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="BEOs"
        subtitle={rows.length === 1 ? "1 Banquet Event Order" : `${rows.length} Banquet Event Orders`}
        action={<Button href="/console/sales/beos/new">+ New BEO</Button>}
      />
      <div className="page-content">
        <DataTable<BeoRow>
          rows={rows}
          rowHref={(r) => `/console/sales/beos/${r.id}`}
          columns={[
            {
              key: "event_name",
              header: "Event",
              render: (r) => r.event_name,
              accessor: (r) => r.event_name,
            },
            {
              key: "beo_number",
              header: "BEO #",
              render: (r) => r.beo_number ?? "—",
              accessor: (r) => r.beo_number ?? null,
            },
            {
              key: "event_date",
              header: "Date",
              render: (r) => r.event_date ?? "—",
              accessor: (r) => r.event_date ?? null,
            },
            {
              key: "space",
              header: "Space",
              render: (r) => r.space ?? "—",
              accessor: (r) => r.space ?? null,
            },
            {
              key: "headcount",
              header: "Pax",
              render: (r) => String(r.headcount),
              accessor: (r) => r.headcount,
            },
            {
              key: "beo_state",
              header: "Status",
              render: (r) => <StatusBadge status={r.beo_state} />,
              accessor: (r) => r.beo_state,
            },
            {
              key: "created",
              header: "Added",
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
