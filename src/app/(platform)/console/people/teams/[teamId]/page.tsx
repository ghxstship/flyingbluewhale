import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { getTeam, listTeamMembers } from "@/lib/db/teams";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { TeamForms } from "./TeamForms";

export const dynamic = "force-dynamic";

type OrgMemberRow = {
  user_id: string;
  users: { id: string; name: string | null; email: string } | null;
};

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="People · Teams" title="Team" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const { teamId } = await params;
  const session = await requireSession();
  const canManage = isManagerPlus(session);

  const team = await getTeam({ id: teamId });
  if (!team) notFound();

  const members = await listTeamMembers({ teamId });
  const memberUserIds = new Set(members.map((m) => m.userId));

  // Org members not yet on the team — used to populate the "Add member" picker.
  const supabase = await createClient();
  const { data: orgMembers } = await supabase
    .from("memberships")
    .select("user_id, users(id, name, email)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  const orgMemberRows = (orgMembers ?? []) as unknown as OrgMemberRow[];
  const eligibleToAdd = orgMemberRows
    .filter((r) => r.users && !memberUserIds.has(r.users.id))
    .map((r) => ({
      id: r.users!.id,
      label: r.users!.name ? `${r.users!.name} <${r.users!.email}>` : r.users!.email,
    }));

  return (
    <>
      <ModuleHeader
        eyebrow="People · Teams"
        title={team.name}
        subtitle={`@team-${team.slug}${team.description ? ` — ${team.description}` : ""}`}
      />

      <div className="page-content space-y-6">
        {canManage && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Edit Team</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Slug is locked once created. Delete the team and recreate if you need to rename the
              <code className="font-mono"> @team-</code> handle.
            </p>
            <div className="mt-4">
              <TeamForms.EditTeam
                teamId={team.id}
                defaultName={team.name}
                defaultDescription={team.description ?? ""}
              />
            </div>
          </section>
        )}

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Members ({members.length})</h3>
          {members.length === 0 ? (
            <EmptyState
              title="No Members Yet"
              description={
                canManage
                  ? "Add org members below to fan out @team-mentions and team-scoped record grants."
                  : "Ask a manager to add members to this team."
              }
            />
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Added</th>
                  {canManage && <th aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.userId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={m.user?.name ?? m.user?.email ?? "?"} />
                        <div>
                          <div className="text-sm font-medium">{m.user?.name ?? "—"}</div>
                          <div className="font-mono text-xs text-[var(--text-muted)]">{m.user?.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {canManage ? (
                        <TeamForms.UpdateMemberRole teamId={team.id} userId={m.userId} defaultRole={m.role} />
                      ) : (
                        <Badge variant={m.role === "admin" ? "brand" : "muted"}>{m.role}</Badge>
                      )}
                    </td>
                    <td className="font-mono text-xs text-[var(--text-muted)]">{timeAgo(m.addedAt)}</td>
                    {canManage && (
                      <td className="text-right">
                        <TeamForms.RemoveMember teamId={team.id} userId={m.userId} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {canManage && eligibleToAdd.length > 0 && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Add Member</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Pick from your org directory. The new member receives @team-{team.slug} mentions immediately.
            </p>
            <div className="mt-4">
              <TeamForms.AddMember teamId={team.id} eligible={eligibleToAdd} />
            </div>
          </section>
        )}

        {canManage && (
          <section className="surface border-l-4 border-[var(--color-error)]/40 p-5">
            <h3 className="text-sm font-semibold text-[var(--color-error)]">Danger Zone</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Deleting a team removes all members and cancels any team-scoped record grants. This cannot be undone.
            </p>
            <div className="mt-4">
              <TeamForms.DeleteTeam teamId={team.id} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
