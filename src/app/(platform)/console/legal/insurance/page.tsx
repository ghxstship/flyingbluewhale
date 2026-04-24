import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return (
    <><ModuleHeader eyebrow="Console" title="Insurance policies" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>
  );
  const session = await requireSession();
  const rows = await listOrgScoped("insurance_policies", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Insurance policies" subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          columns={[
            { key: "carrier", header: "Carrier", render: (r) => String(r.carrier ?? "—") },
            { key: "policy_no", header: "Policy No.", render: (r) => <span className="font-mono text-xs">{String(r.policy_no ?? "—")}</span> },
            { key: "kind", header: "Kind", render: (r) => String(r.kind ?? "—") },
            { key: "effective_on", header: "Effective", render: (r) => <span className="font-mono text-xs">{String(r.effective_on ?? "—")}</span> },
            { key: "expires_on", header: "Expires", render: (r) => <span className="font-mono text-xs">{String(r.expires_on ?? "—")}</span> },
          ]}
        />
      </div>
    </>
  );
}
