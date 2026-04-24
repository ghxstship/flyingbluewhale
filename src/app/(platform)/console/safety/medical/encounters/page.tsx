import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Medical encounters" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("medical_encounters", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Medical encounters" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "triage", header: "Triage", render: (r) => String(r.triage ?? "—") },
            { key: "chief_complaint", header: "Complaint", render: (r) => String(r.chief_complaint ?? "—") },
            { key: "disposition", header: "Disposition", render: (r) => String(r.disposition ?? "—") },
            { key: "created_at", header: "At", render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
