import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Consent records" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("consent_records", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Consent records" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "purpose", header: "Purpose", render: (r) => String(r.purpose ?? "—") },
            { key: "granted", header: "Granted", render: (r) => String(r.granted ?? "—") },
            { key: "version", header: "Version", render: (r) => <span className="font-mono text-xs">{String(r.version ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
