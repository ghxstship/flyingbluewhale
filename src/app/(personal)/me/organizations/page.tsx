import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type Row = { id: string; role: string; orgs: { id: string; name: string; slug: string; tier: string } | null };

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  if (!hasSupabase) {
    return <div><h1 className="text-2xl font-semibold">Organizations</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Configure Supabase.</p></div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id,role,orgs(id,name,slug,tier)")
    .eq("user_id", session.userId);
  const rows = (data ?? []) as unknown as Row[];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">Every org you're a member of</p>
      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No memberships yet"
            description="Create an organization from the console to get started."
          />
        </div>
      ) : (
      <div className="surface mt-6 divide-y divide-[var(--border-color)]">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-semibold">{r.orgs?.name ?? "—"}</div>
              <div className="font-mono text-xs text-[var(--text-muted)]">{r.orgs?.slug}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="cyan">{r.orgs?.tier}</Badge>
              <Badge variant="brand">{r.role}</Badge>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
