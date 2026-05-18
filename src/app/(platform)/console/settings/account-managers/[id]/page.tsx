import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toggleActive, deleteAssignment } from "./actions";
import { formatDateTime } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("account_manager_assignments")
    .select("id, persona, active, created_at, portal_user_id, manager_user_id, project_id, chat_room_id")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) notFound();
  const a = data as {
    id: string;
    persona: string;
    active: boolean;
    created_at: string;
    portal_user_id: string;
    manager_user_id: string;
    project_id: string | null;
    chat_room_id: string | null;
  };

  const userIds = [a.portal_user_id, a.manager_user_id];
  const [{ data: members }, projectRes] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(email, name)")
      .eq("org_id", session.orgId)
      .in("user_id", userIds),
    a.project_id
      ? supabase.from("projects").select("name").eq("id", a.project_id).eq("org_id", session.orgId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const byId = new Map<string, { email: string; name: string | null }>();
  for (const m of (members ?? []) as Array<{ user_id: string; users: { email: string; name: string | null } | null }>) {
    if (m.users) byId.set(m.user_id, m.users);
  }
  const portal = byId.get(a.portal_user_id);
  const manager = byId.get(a.manager_user_id);
  const project = (projectRes as { data: { name: string } | null }).data;

  return (
    <>
      <ModuleHeader
        eyebrow="Account Managers"
        title={`${portal?.name ?? portal?.email ?? "Portal user"} ↔ ${manager?.name ?? manager?.email ?? "Manager"}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{a.persona}</Badge>
            <Badge variant={a.active ? "success" : "muted"}>{a.active ? "Active" : "Inactive"}</Badge>
            {project ? (
              <span className="text-xs">Project: {project.name}</span>
            ) : (
              <span className="text-xs">Org-wide</span>
            )}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <form action={toggleActive}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="next" value={a.active ? "false" : "true"} />
              <button type="submit" className="btn btn-secondary btn-sm">
                {a.active ? "Deactivate" : "Reactivate"}
              </button>
            </form>
            <DeleteForm
              action={deleteAssignment.bind(null, a.id)}
              confirm="Delete this account-manager assignment? The underlying chat room is preserved."
            />
          </div>
        }
      />
      <div className="page-content max-w-2xl space-y-3">
        <section className="surface grid grid-cols-2 gap-3 p-4 text-xs">
          <div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Portal user</div>
            <div className="mt-1 font-mono">{portal?.email ?? a.portal_user_id}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Manager</div>
            <div className="mt-1 font-mono">{manager?.email ?? a.manager_user_id}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Chat room</div>
            <div className="mt-1 font-mono">
              {a.chat_room_id ? a.chat_room_id.slice(0, 8) : "— (created on first /messages/start)"}
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Created</div>
            <div className="mt-1 font-mono">{formatDateTime(a.created_at)}</div>
          </div>
        </section>
      </div>
    </>
  );
}
