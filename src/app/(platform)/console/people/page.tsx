import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

type MemberRow = { id: string; role: string; created_at: string; users: { id: string; name: string | null; email: string } | null };

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  if (!hasSupabase) return <><ModuleHeader title="Directory" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id,role,created_at,users(id,name,email)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as MemberRow[];

  return (
    <>
      <ModuleHeader eyebrow="People" title="Directory" subtitle={`${rows.length} member${rows.length === 1 ? "" : "s"}`} />
      <div className="page-content">
        <DataTable<MemberRow>
          rows={rows}
          columns={[
            { key: "user", header: "Member", render: (r) => (
              <div className="flex items-center gap-2">
                <Avatar name={r.users?.name ?? r.users?.email ?? "?"} />
                <div>
                  <div className="text-sm font-medium">{r.users?.name ?? "—"}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{r.users?.email}</div>
                </div>
              </div>
            ) },
            { key: "role", header: "Role", render: (r) => <Badge variant="brand">{r.role}</Badge> },
            { key: "since", header: "Member since", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
