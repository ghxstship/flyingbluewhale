import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Print Queue" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("accreditations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "state", op: "eq", value: "approved" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation"
        title="Print Queue"
        subtitle={`${rows.length} approved badge${rows.length === 1 ? "" : "s"} pending print`}
        action={
          rows.length > 0 ? (
            <Button href="/console/accreditation/print/sheet" size="sm">
              Print sheet
            </Button>
          ) : null
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          emptyLabel="No badges queued"
          emptyDescription="Approve accreditations under /console/accreditation. Approved cards appear here ready for batch print."
          columns={[
            {
              key: "person_name",
              header: "Person",
              render: (r) => String(r.person_name ?? "—"),
              accessor: (r) => r.person_name ?? null,
            },
            {
              key: "card_barcode",
              header: "Barcode",
              render: (r) => <span className="font-mono text-xs">{String(r.card_barcode ?? "—")}</span>,
              accessor: (r) => r.card_barcode ?? null,
            },
            {
              key: "state",
              header: "State",
              render: (r) => String(r.state ?? "—"),
              accessor: (r) => r.state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
