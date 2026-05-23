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
        <ModuleHeader eyebrow="Workspace" title="Program Reviews" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("program_reviews", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow="Programs"
        title="Program Reviews"
        subtitle={`${rows.length} Record${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/programs/reviews/new" size="sm">
            + Schedule review
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/programs/reviews/${r.id}`}
          emptyLabel="No program reviews"
          emptyDescription="Stage gates, mid-event syncs, and post-mortems with attached actions."
          emptyAction={
            <Button href="/console/programs/reviews/new" size="sm">
              + Schedule review
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => String(r.title ?? "—"), accessor: (r) => r.title ?? null },
            {
              key: "scheduled_at",
              header: "Scheduled",
              render: (r) => <span className="font-mono text-xs">{String(r.scheduled_at ?? "—")}</span>,
              accessor: (r) => r.scheduled_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
