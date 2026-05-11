import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { awardBadge } from "./actions";

export const dynamic = "force-dynamic";

type Award = { id: string; user_id: string; note: string | null; awarded_at: string };

export default async function Page({ params }: { params: Promise<{ badgeId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { badgeId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: badge } = await supabase
    .from("badges")
    .select("id, code, name, description, icon, created_at")
    .eq("id", badgeId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!badge) notFound();
  const b = badge as {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    created_at: string;
  };

  const [{ data: awards }, { data: members }] = await Promise.all([
    supabase
      .from("badge_awards")
      .select("id, user_id, note, awarded_at")
      .eq("badge_id", badgeId)
      .order("awarded_at", { ascending: false })
      .limit(100),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const awardList = (awards ?? []) as Award[];
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u);
  const memberMap = new Map(memberList.map((m) => [m.id, m.name ?? m.email]));

  return (
    <>
      <ModuleHeader
        eyebrow="Badge"
        title={`${b.icon ?? "🏅"} ${b.name}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{b.code}</Badge>
            <span className="font-mono text-xs">{awardList.length} awarded</span>
          </span>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {b.description && <div className="surface p-4 text-sm text-[var(--text-secondary)]">{b.description}</div>}

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Award This Badge</h2>
          <form action={awardBadge} className="mt-3 space-y-2">
            <input type="hidden" name="badgeId" value={b.id} />
            <select name="user_id" required className="input-base w-full">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            <textarea
              name="note"
              rows={2}
              maxLength={300}
              placeholder="Why this person earned it (optional)"
              className="input-base w-full"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Award
            </button>
          </form>
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Recent Awards</h2>
          {awardList.length === 0 ? (
            <div className="mt-2">
              <EmptyState size="compact" title="No awards yet" description="Award this badge from the form above." />
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {awardList.map((a) => (
                <li key={a.id} className="flex items-start justify-between text-xs">
                  <div>
                    <div className="font-semibold">{memberMap.get(a.user_id) ?? "Unknown"}</div>
                    {a.note && <p className="text-[var(--text-secondary)]">{a.note}</p>}
                  </div>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {new Date(a.awarded_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
