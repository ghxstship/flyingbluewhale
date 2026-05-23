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
        <ModuleHeader eyebrow="Workspace" title="Medical Encounters" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("medical_encounters", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Medical"
        title="Encounters"
        subtitle={`${rows.length} Record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/safety/medical/encounters/new" size="sm">
            + Log encounter
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/medical/encounters/${r.id}`}
          emptyLabel="No medical encounters"
          emptyDescription="Clinical encounters are retained per local record-law. Detail view holds triage, complaint, and disposition."
          emptyAction={
            <Button href="/console/safety/medical/encounters/new" size="sm">
              + Log encounter
            </Button>
          }
          columns={[
            {
              key: "triage",
              header: "Triage",
              render: (r) => String(r.triage ?? "—"),
              accessor: (r) => r.triage ?? null,
            },
            {
              key: "chief_complaint",
              header: "Complaint",
              render: (r) => String(r.chief_complaint ?? "—"),
              accessor: (r) => r.chief_complaint ?? null,
            },
            {
              key: "disposition",
              header: "Disposition",
              render: (r) => String(r.disposition ?? "—"),
              accessor: (r) => r.disposition ?? null,
            },
            {
              key: "created_at",
              header: "At",
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
