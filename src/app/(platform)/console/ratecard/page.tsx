import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Rate card" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("rate_card_items", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Rate card" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "catalog", header: "Catalog", render: (r) => String(r.catalog ?? "—") },
            { key: "sku", header: "SKU", render: (r) => <span className="font-mono text-xs">{String(r.sku ?? "—")}</span> },
            { key: "name", header: "Name", render: (r) => String(r.name ?? "—") },
            { key: "unit_price_cents", header: "Unit ¢", render: (r) => <span className="font-mono text-xs">{String(r.unit_price_cents ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
