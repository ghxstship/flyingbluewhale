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
        <ModuleHeader eyebrow="Workspace" title="Rate Card Items" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("rate_card_items", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Logistics"
        title="Rate Card Items"
        subtitle={`${rows.length} Item${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/logistics/ratecard/new" size="sm">
            + New Rate
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/logistics/ratecard/${r.id}`}
          emptyLabel="No rate-card items yet"
          emptyDescription="Author SKUs with unit prices that downstream POs and proposals reference."
          emptyAction={
            <Button href="/console/logistics/ratecard/new" size="sm">
              + New Rate
            </Button>
          }
          columns={[
            {
              key: "catalog",
              header: "Catalog",
              render: (r) => String(r.catalog ?? "—"),
              accessor: (r) => r.catalog ?? null,
            },
            {
              key: "sku",
              header: "SKU",
              render: (r) => <span className="font-mono text-xs">{String(r.sku ?? "—")}</span>,
              accessor: (r) => r.sku ?? null,
            },
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—"), accessor: (r) => r.name ?? null },
            {
              key: "unit_price_cents",
              header: "Unit ¢",
              render: (r) => <span className="font-mono text-xs">{String(r.unit_price_cents ?? "—")}</span>,
              accessor: (r) => Number(r.unit_price_cents ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
