import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Print queue" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("accreditations", session.orgId, { orderBy: "created_at", ascending: false, limit: 500, filters: [{ column: "state", op: "eq", value: "approved" }] });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Print queue" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "person_name", header: "Person", render: (r) => String(r.person_name ?? "—") },
            { key: "card_barcode", header: "Barcode", render: (r) => <span className="font-mono text-xs">{String(r.card_barcode ?? "—")}</span> },
            { key: "state", header: "State", render: (r) => String(r.state ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
