import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toTitle } from "@/lib/format";
import { InviteForm } from "./InviteForm";

function relTime(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const s = Math.round(abs / 1000);
  const m = Math.round(s / 60);
  const h = Math.round(m / 60);
  const d = Math.round(h / 24);
  const fmt = s < 60 ? `${s}s` : m < 60 ? `${m}m` : h < 48 ? `${h}h` : `${d}d`;
  return ms >= 0 ? `in ${fmt}` : `${fmt} ago`;
}

export const dynamic = "force-dynamic";

export default async function InvitesPage() {
  const session = await requireSession();
  const isAdmin = sessionIsAdmin(session);

  const supabase = await createClient();
  const [{ data: rawInvites }, { data: projects }] = await Promise.all([
    supabase
      .from("invites")
      .select("id, email, role, status, expires_at, accepted_at, created_at, token, project_id, project_role")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
  ]);
  const invites = rawInvites ?? [];

  // Build project name lookup so the table can show "<role> on <project>" for
  // scoped invites without an extra join.
  const projectName = new Map<string, string>((projects ?? []).map((p) => [p.id, p.name]));

  const pending = invites.filter((i) => i.status === "pending");
  const history = invites.filter((i) => i.status !== "pending");

  return (
    <>
      <ModuleHeader eyebrow="People" title="Invites" subtitle="Pending organization invitations" />
      <div className="page-content space-y-6">
        {isAdmin && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Invite Someone</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              They&apos;ll get an email with a link to accept. Expires in 7 days.
            </p>
            <div className="mt-4">
              <InviteForm projects={(projects ?? []) as Array<{ id: string; name: string }>} />
            </div>
          </section>
        )}

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Pending ({pending.length})</h3>
          {pending.length === 0 ? (
            <EmptyState
              title="No Pending Invites"
              description={isAdmin ? "Send one above to get started." : "Ask an admin to invite new members."}
            />
          ) : (
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((i) => (
                  <tr key={i.id}>
                    <td>{i.email}</td>
                    <td>
                      <Badge variant="brand">{i.role}</Badge>
                      {i.project_id && (
                        <span className="ms-2 text-xs text-[var(--text-muted)]">
                          + {i.project_role} on {projectName.get(i.project_id) ?? "project"}
                        </span>
                      )}
                    </td>
                    <td className="text-[var(--text-muted)]">{relTime(i.expires_at)}</td>
                    <td>
                      <Button href={`/accept-invite/${i.token}`} variant="ghost" size="sm">
                        Copy link
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {history.length > 0 && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">History</h3>
            <table className="data-table mt-3">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {history.map((i) => (
                  <tr key={i.id}>
                    <td>{i.email}</td>
                    <td className="text-[var(--text-muted)]">{i.role}</td>
                    <td>
                      <Badge variant={i.status === "accepted" ? "success" : "muted"}>{toTitle(i.status)}</Badge>
                    </td>
                    <td className="text-[var(--text-muted)]">{relTime(i.accepted_at ?? i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}
