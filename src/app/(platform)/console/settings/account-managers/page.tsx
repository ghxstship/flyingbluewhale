import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  persona: string;
  active: boolean;
  created_at: string;
  portal_user_id: string;
  manager_user_id: string;
  project_id: string | null;
  chat_room_id: string | null;
  portal_email: string | null;
  manager_email: string | null;
  project_name: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Account Managers" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Two-step fetch: pull assignments then hydrate portal/manager/project
  // labels via batched lookups. The view doesn't expose joined emails
  // because auth.users isn't org-scoped — RLS on memberships gives us a
  // safe per-org filter for resolving display labels.
  const { data: rows } = await supabase
    .from("account_manager_assignments")
    .select("id, persona, active, created_at, portal_user_id, manager_user_id, project_id, chat_room_id")
    .eq("org_id", session.orgId)
    .order("active", { ascending: false })
    .order("created_at", { ascending: false });

  const assignments = (rows ?? []) as Array<{
    id: string;
    persona: string;
    active: boolean;
    created_at: string;
    portal_user_id: string;
    manager_user_id: string;
    project_id: string | null;
    chat_room_id: string | null;
  }>;

  const userIds = Array.from(new Set(assignments.flatMap((a) => [a.portal_user_id, a.manager_user_id])));
  const projectIds = Array.from(new Set(assignments.map((a) => a.project_id).filter((v): v is string => !!v)));

  const [{ data: members }, { data: projects }] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("memberships")
          .select("user_id, users:users!inner(email)")
          .eq("org_id", session.orgId)
          .in("user_id", userIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; users: { email: string | null } | null }> }),
    projectIds.length > 0
      ? supabase.from("projects").select("id, name").eq("org_id", session.orgId).in("id", projectIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);
  const emailById = new Map<string, string>();
  for (const m of (members ?? []) as Array<{ user_id: string; users: { email: string | null } | null }>) {
    if (m.users?.email) emailById.set(m.user_id, m.users.email);
  }
  const projectById = new Map<string, string>();
  for (const p of (projects ?? []) as Array<{ id: string; name: string }>) projectById.set(p.id, p.name);

  const hydrated: Row[] = assignments.map((a) => ({
    ...a,
    portal_email: emailById.get(a.portal_user_id) ?? null,
    manager_email: emailById.get(a.manager_user_id) ?? null,
    project_name: a.project_id ? (projectById.get(a.project_id) ?? null) : null,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Account Managers"
        subtitle={`${hydrated.length} Assignment${hydrated.length === 1 ? "" : "s"} · who handles which portal user across personas`}
        action={
          <Button href="/console/settings/account-managers/new" size="sm">
            + New Assignment
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={hydrated}
          rowHref={(r) => `/console/settings/account-managers/${r.id}`}
          emptyLabel="No account-manager assignments yet"
          emptyDescription="Pair a portal user (vendor, sponsor, delegation contact, etc.) with the org-side manager who handles their thread."
          columns={[
            {
              key: "portal_email",
              header: "Portal user",
              render: (r) => r.portal_email ?? r.portal_user_id.slice(0, 8),
              mono: true,
            },
            {
              key: "persona",
              header: "Persona",
              render: (r) => <Badge variant="muted">{r.persona}</Badge>,
            },
            {
              key: "manager_email",
              header: "Account manager",
              render: (r) => r.manager_email ?? r.manager_user_id.slice(0, 8),
              mono: true,
            },
            {
              key: "project_name",
              header: "Project",
              render: (r) => r.project_name ?? "Org-wide",
            },
            {
              key: "active",
              header: "Status",
              render: (r) =>
                r.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
