import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { createAssignment } from "./actions";

export const dynamic = "force-dynamic";

const PERSONAS = [
  "artist",
  "athlete",
  "client",
  "crew",
  "delegation",
  "guest",
  "hospitality",
  "media",
  "producer",
  "promoter",
  "sponsor",
  "stakeholder",
  "vendor",
  "vip",
  "volunteer",
] as const;

export default async function Page() {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: members }, { data: projects }] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
  ]);

  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  const projectList = (projects ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader eyebrow="Settings" title="New Account-Manager Assignment" />
      <div className="page-content max-w-2xl">
        <FormShell action={createAssignment} cancelHref="/console/settings/account-managers" submitLabel="Create">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Portal user</label>
            <select name="portal_user_id" required className="input-base mt-1.5 w-full">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              The portal-side user — vendor, sponsor, delegation contact, etc.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Persona</label>
            <select name="persona" required className="input-base mt-1.5 w-full" defaultValue="vendor">
              {PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {toTitle(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Account manager</label>
            <select name="manager_user_id" required className="input-base mt-1.5 w-full">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Project (optional)</label>
            <select name="project_id" className="input-base mt-1.5 w-full" defaultValue="">
              <option value="">Org-wide (any project)</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Same portal user can have different AMs per project + persona.
            </p>
          </div>
        </FormShell>
      </div>
    </>
  );
}
