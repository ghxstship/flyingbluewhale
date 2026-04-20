export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, fmtDate } from "@/components/detail/DetailShell";
import { Badge } from "@/components/ui/Badge";

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  // Person = membership + user. personId is the user id.
  const { data: row } = await supabase
    .from("memberships")
    .select("id, role, created_at, users:users(id, name, email)")
    .eq("org_id", session.orgId)
    .eq("user_id", personId)
    .maybeSingle();
  type Row = { id: string; role: string; created_at: string; users: { id: string; name: string | null; email: string } | null };
  const typed = (row as unknown as Row | null);
  return (
    <DetailShell
      row={typed}
      eyebrow="People"
      title={(r) => r.users?.name ?? r.users?.email ?? "Member"}
      subtitle={(r) => r.users?.email}
      breadcrumbs={[
        { label: "People" },
        { label: "Directory", href: "/console/people" },
        { label: typed?.users?.name ?? typed?.users?.email ?? "Member" },
      ]}
      fields={typed ? [
        { label: "Role", value: <Badge variant="brand">{typed.role}</Badge> },
        { label: "Email", value: typed.users?.email ?? "—" },
        { label: "Joined", value: fmtDate(typed.created_at) },
      ] : undefined}
    />
  );
}
