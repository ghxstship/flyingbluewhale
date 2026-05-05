import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { listTeams } from "@/lib/db/teams";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { CreateTeamForm } from "./CreateTeamForm";

export const dynamic = "force-dynamic";

type TeamListRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  updatedAt: string;
};

export default async function TeamsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People" title="Teams" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const canManage = isManagerPlus(session);
  const teams = await listTeams({ orgId: session.orgId });

  const rows: TeamListRow[] = teams.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    ownerId: t.ownerId,
    updatedAt: t.updatedAt,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="People"
        title="Teams"
        subtitle={`${rows.length} team${rows.length === 1 ? "" : "s"} — addressable as @team-<slug> in mentions`}
      />
      <div className="page-content space-y-6">
        {canManage && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Create Team</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Slug becomes the @-mention handle (e.g. <code>@team-prod</code>). Lowercase letters, digits, hyphens.
            </p>
            <div className="mt-4">
              <CreateTeamForm />
            </div>
          </section>
        )}

        {rows.length === 0 ? (
          <EmptyState
            title="No Teams Yet"
            description={
              canManage
                ? "Create one above. Teams let you @-mention a group and grant record-level permissions to many people at once."
                : "Ask an admin or manager to create teams for your org."
            }
          />
        ) : (
          <DataTable<TeamListRow>
            rows={rows}
            rowHref={(r) => `/console/people/teams/${r.id}`}
            emptyLabel="No teams"
            columns={[
              {
                key: "team",
                header: "Team",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} />
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className="font-mono text-xs text-[var(--text-muted)]">@team-{r.slug}</div>
                    </div>
                  </div>
                ),
                accessor: (r) => r.name,
                sortable: true,
              },
              {
                key: "description",
                header: "Description",
                render: (r) => <span className="text-xs text-[var(--text-muted)]">{r.description ?? "—"}</span>,
                accessor: (r) => r.description ?? "",
              },
              {
                key: "slug",
                header: "Mention",
                render: (r) => <Badge variant="muted">@team-{r.slug}</Badge>,
                accessor: (r) => r.slug,
                filterable: true,
              },
              {
                key: "updated",
                header: "Updated",
                render: (r) => timeAgo(r.updatedAt),
                className: "font-mono text-xs",
                accessor: (r) => r.updatedAt,
                sortable: true,
              },
            ]}
          />
        )}

        <section className="surface p-4 text-xs text-[var(--text-muted)]">
          Need to grant record-level access? Open a record and use <em>Share</em> to add a Team (or individual user)
          with a SmartSuite-style role: viewer · commenter · assignee · contributor · editor · full.{" "}
          <Link href="/console/settings/audit" className="underline">
            Audit log
          </Link>{" "}
          tracks every grant.
        </section>
      </div>
    </>
  );
}
