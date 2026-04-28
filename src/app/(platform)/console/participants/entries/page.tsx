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
        <ModuleHeader eyebrow="Console" title="Entries" />
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
        subtitle={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/participants/entries/new" size="sm">
            + New entry
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
              + New entry
            </Button>
          }
          columns={[
            { key: "participant_name", header: "Participant", render: (r) => String(r.participant_name ?? "—") },
            { key: "discipline", header: "Discipline", render: (r) => String(r.discipline ?? "—") },
            { key: "event", header: "Event", render: (r) => String(r.event ?? "—") },
            { key: "status", header: "Status", render: (r) => String(r.status ?? "—") },
          ]}
        />
      </div>
    </>
  );
}
