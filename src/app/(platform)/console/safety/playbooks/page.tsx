import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { Playbook } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<Playbook["status"], "muted" | "success" | "warning"> = {
  draft: "muted",
  published: "success",
  archived: "warning",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Playbooks" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("playbooks", session.orgId, {
    orderBy: "updated_at",
    ascending: false,
    limit: 500,
  })) as Playbook[];

  const published = rows.filter((r) => r.status === "published").length;

  // Aggregate by kind
  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const kindEntries = Object.entries(byKind).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Playbooks"
        subtitle={`${rows.length} playbook${rows.length === 1 ? "" : "s"} · ${published} published`}
        action={
          <Button href="/console/safety/playbooks/new" size="sm">
            + New Playbook
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {kindEntries.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">By Kind</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {kindEntries.map(([kind, count]) => (
                <li key={kind} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{kind}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<Playbook>
          rows={rows}
          emptyLabel="No playbooks authored"
          emptyDescription="ConOps playbooks render in the Guide layout. Author one per scenario — crisis comms, evacuation, weather hold, dignitary visit."
          emptyAction={
            <Button href="/console/safety/playbooks/new" size="sm">
              + New Playbook
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "slug", header: "Slug", render: (r) => <span className="font-mono text-xs">{r.slug}</span> },
            { key: "kind", header: "Kind", render: (r) => <Badge variant="muted">{r.kind}</Badge> },
            {
              key: "version",
              header: "Version",
              render: (r) => <span className="font-mono text-xs">v{r.version}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{r.status}</Badge>,
            },
            {
              key: "updated_at",
              header: "Updated",
              render: (r) => <span className="font-mono text-xs">{r.updated_at?.slice(0, 10)}</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
