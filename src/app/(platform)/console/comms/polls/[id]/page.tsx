import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { closePoll } from "./actions";

export const dynamic = "force-dynamic";

type Option = { id: string; ordinal: number; label: string };
type Vote = { option_id: string };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.comms.polls.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("id, question, publish_state, audience, created_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!poll) notFound();
  const p = poll as { id: string; question: string; publish_state: string; audience: string; created_at: string };

  const [{ data: options }, { data: votes }] = await Promise.all([
    supabase.from("poll_options").select("id, ordinal, label").eq("poll_id", id).order("ordinal"),
    supabase.from("poll_votes").select("option_id").eq("poll_id", id),
  ]);
  const opts = (options ?? []) as Option[];
  const tally = new Map<string, number>();
  for (const v of (votes ?? []) as Vote[]) tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1);
  const total = (votes ?? []).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.polls.detail.eyebrow", undefined, "Poll")}
        title={p.question}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={p.publish_state === "live" ? "success" : p.publish_state === "closed" ? "muted" : "info"}>
              {p.publish_state}
            </Badge>
            <Badge variant="muted">{toTitle(p.audience)}</Badge>
            <span className="font-mono text-xs">
              {t("console.comms.polls.detail.votesCount", { count: total }, `${total} votes`)}
            </span>
          </span>
        }
        action={
          p.publish_state === "live" ? (
            <form action={closePoll}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="btn btn-secondary">
                {t("console.comms.polls.detail.closePoll", undefined, "Close Poll")}
              </button>
            </form>
          ) : null
        }
      />
      <div className="page-content max-w-2xl">
        <ul className="space-y-3">
          {opts.map((o) => {
            const count = tally.get(o.id) ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li key={o.id} className="surface p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{o.label}</span>
                  <span className="font-mono text-xs">
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-inset)]">
                  <div className="h-full rounded-full bg-[var(--org-primary)]" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
