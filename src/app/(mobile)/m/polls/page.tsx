import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { castVote } from "./actions";

export const dynamic = "force-dynamic";

type Poll = { id: string; question: string; publish_state: string; closes_at: string | null };
type Option = { id: string; poll_id: string; ordinal: number; label: string };
type Vote = { poll_id: string; option_id: string };

export default async function MobilePollsPage() {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: polls } = await supabase
    .from("polls")
    .select("id, question, publish_state, closes_at")
    .eq("org_id", session.orgId)
    .eq("publish_state", "live")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(25);

  const pollIds = ((polls ?? []) as Poll[]).map((p) => p.id);
  const [{ data: options }, { data: votes }] = pollIds.length
    ? await Promise.all([
        supabase.from("poll_options").select("id, poll_id, ordinal, label").in("poll_id", pollIds).order("ordinal"),
        supabase.from("poll_votes").select("poll_id, option_id").in("poll_id", pollIds).eq("voter_id", session.userId),
      ])
    : [{ data: [] as Option[] }, { data: [] as Vote[] }];

  const optsByPoll = new Map<string, Option[]>();
  for (const o of (options ?? []) as Option[]) {
    if (!optsByPoll.has(o.poll_id)) optsByPoll.set(o.poll_id, []);
    optsByPoll.get(o.poll_id)!.push(o);
  }
  const myVote = new Map<string, string>();
  for (const v of (votes ?? []) as Vote[]) myVote.set(v.poll_id, v.option_id);

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Polls</h1>

      <ul className="mt-5 space-y-3">
        {((polls ?? []) as Poll[]).length === 0 ? (
          <li>
            <EmptyState size="compact" title="No Active Polls" description="Live polls will appear here." />
          </li>
        ) : (
          ((polls ?? []) as Poll[]).map((p) => {
            const opts = optsByPoll.get(p.id) ?? [];
            const voted = myVote.get(p.id);
            return (
              <li key={p.id} className="surface p-4">
                <Badge variant="info">Live</Badge>
                <h2 className="mt-2 text-sm font-semibold">{p.question}</h2>
                {voted ? (
                  <ul className="mt-3 space-y-1.5">
                    {opts.map((o) => (
                      <li
                        key={o.id}
                        className={
                          o.id === voted
                            ? "rounded-md border border-[var(--org-primary)] bg-[var(--org-primary)]/10 px-3 py-2 text-xs"
                            : "rounded-md border border-[var(--border-color)] px-3 py-2 text-xs opacity-70"
                        }
                      >
                        {o.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <form action={castVote} className="mt-3 space-y-1.5">
                    <input type="hidden" name="poll_id" value={p.id} />
                    {opts.map((o) => (
                      <label
                        key={o.id}
                        className="flex items-center gap-2 rounded-md border border-[var(--border-color)] px-3 py-2 text-xs"
                      >
                        <input type="radio" name="option_id" value={o.id} required />
                        {o.label}
                      </label>
                    ))}
                    <Button type="submit" size="sm" className="mt-2 w-full">Vote</Button>
                  </form>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
