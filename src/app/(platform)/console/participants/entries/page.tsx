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
        <ModuleHeader eyebrow="Workspace" title="Entries" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("delegation_entries", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Participants"
        title="Entries"
        subtitle={`${rows.length} Record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/participants/entries/new" size="sm">
            + New Entry
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/participants/entries/${r.id}`}
          emptyLabel="No participant entries"
          emptyDescription="Per-discipline entries from each delegation; status flows through nominate → confirm → on-site."
          emptyAction={
            <Button href="/console/participants/entries/new" size="sm">
              + New Entry
            </Button>
          }
          columns={[
            {
              key: "participant_name",
              header: "Participant",
              render: (r) => String(r.participant_name ?? "—"),
              accessor: (r) => r.participant_name ?? null,
            },
            {
              key: "discipline",
              header: "Discipline",
              render: (r) => String(r.discipline ?? "—"),
              accessor: (r) => r.discipline ?? null,
              filterable: true,
              groupable: true,
            },
            { key: "event", header: "Event", render: (r) => String(r.event ?? "—"), accessor: (r) => r.event ?? null },
            {
              key: "status",
              header: "Status",
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
