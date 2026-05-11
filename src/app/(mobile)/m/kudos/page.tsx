import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { createKudos } from "./actions";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  value_tag: string | null;
  points: number;
  created_at: string;
};

type Member = { id: string; email: string };

export default async function MobileKudosPage() {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: posts } = await supabase
    .from("recognition_posts")
    .select("id, from_user_id, to_user_id, message, value_tag, points, created_at")
    .eq("org_id", session.orgId)
    .eq("visibility_state", "public")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(id, email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  const members = ((memberships ?? []) as Array<{ user_id: string; users: { id: string; email: string } | null }>)
    .map((m) => m.users)
    .filter((u): u is Member => !!u);
  const memberMap = new Map(members.map((m) => [m.id, m.email]));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Kudos</h1>

      <details className="surface mt-4 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Give Kudos</summary>
        <form action={createKudos} className="mt-3 space-y-2">
          <label className="block text-xs font-semibold">
            To
            <select
              name="to_user_id"
              required
              className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            >
              {members
                .filter((m) => m.id !== session.userId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.email}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Message
            <textarea
              name="message"
              required
              rows={3}
              maxLength={500}
              className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            Value (optional tag)
            <input
              type="text"
              name="value_tag"
              maxLength={40}
              className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="btn btn-primary w-full">
            Send
          </button>
        </form>
      </details>

      <ul className="mt-5 space-y-3">
        {((posts ?? []) as Post[]).length === 0 ? (
          <li>
            <EmptyState size="compact" title="No Kudos Yet" description="Recognition posts will appear here." />
          </li>
        ) : (
          ((posts ?? []) as Post[]).map((p) => (
            <li key={p.id} className="surface p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs">
                  <span className="font-semibold">{memberMap.get(p.from_user_id) ?? "Someone"}</span>{" "}
                  <span className="text-[var(--text-muted)]">→</span>{" "}
                  <span className="font-semibold">{memberMap.get(p.to_user_id) ?? "Someone"}</span>
                </span>
                <span className="font-mono text-xs text-[var(--text-muted)]">{fmt.time(p.created_at)}</span>
              </div>
              <p className="mt-2 text-sm">{p.message}</p>
              <div className="mt-2 flex items-center gap-2">
                {p.value_tag && <Badge variant="info">{p.value_tag}</Badge>}
                {p.points > 0 && <Badge variant="muted">{p.points} pts</Badge>}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
