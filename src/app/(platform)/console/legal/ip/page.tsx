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
        <ModuleHeader eyebrow="Console" title="Trademarks" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("trademarks", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Legal · IP"
        title="Trademarks"
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/legal/ip/new" size="sm">
            + Register mark
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/legal/ip/${r.id}`}
          emptyLabel="No trademarks tracked"
          emptyDescription="Register marks, monitor renewals, and track watch-service hits."
          emptyAction={
            <Button href="/console/legal/ip/new" size="sm">
              + Register mark
            </Button>
          }
          columns={[
            { key: "mark", header: "Mark", render: (r) => String(r.mark ?? "—") },
            { key: "jurisdiction", header: "Jurisdiction", render: (r) => String(r.jurisdiction ?? "—") },
            {
              key: "registration_no",
              header: "Reg No.",
              render: (r) => <span className="font-mono text-xs">{String(r.registration_no ?? "—")}</span>,
            },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
