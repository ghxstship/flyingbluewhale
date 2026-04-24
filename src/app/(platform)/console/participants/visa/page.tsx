import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Visa cases" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("visa_cases", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Visa cases" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "person_name", header: "Name", render: (r) => String(r.person_name ?? "—") },
            { key: "nationality", header: "Nationality", render: (r) => String(r.nationality ?? "—") },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
