export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

type PulseRow = {
  shift_date: string;
  rating: number;
  comment: string | null;
  user_id: string;
};

const EMOJI = ["", "😞", "😐", "🙂", "😊", "🤩"];

function avgTone(avg: number): "error" | "warning" | "success" | "info" {
  if (avg < 2.5) return "error";
  if (avg < 3.5) return "warning";
  if (avg < 4.5) return "info";
  return "success";
}

export default async function SentimentPage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Team Sentiment" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );

  const session = await requireSession();
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: pulses } = await supabase
    .from("shift_pulses")
    .select("shift_date, rating, comment, user_id")
    .eq("org_id", session.orgId)
    .gte("shift_date", thirtyDaysAgo.toISOString().slice(0, 10))
    .order("shift_date", { ascending: false })
    .limit(300);

  const rows = (pulses ?? []) as PulseRow[];
  const avg = rows.length > 0 ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : null;

  // Distribution
  const dist = [0, 0, 0, 0, 0];
  for (const r of rows) dist[r.rating - 1]++;

  // Recent comments (last 10 with content)
  const comments = rows.filter((r) => r.comment).slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Team Sentiment"
        subtitle="30-day shift pulse ratings from your crew"
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">Avg Rating</div>
              <div className="mt-1 text-3xl font-bold">
                {avg != null ? avg.toFixed(1) : "—"}
              </div>
              {avg != null && <Badge variant={avgTone(avg)}>{EMOJI[Math.round(avg)]}</Badge>}
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">Responses</div>
              <div className="mt-1 text-3xl font-bold">{rows.length}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.18em] text-[var(--text-muted)] uppercase">With Comment</div>
              <div className="mt-1 text-3xl font-bold">{comments.length}</div>
            </div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">Rating Distribution</h2>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = dist[n - 1];
              const pct = rows.length > 0 ? (count / rows.length) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-6 text-center text-lg">{EMOJI[n]}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-inset)]">
                    <div
                      className="h-full rounded-full bg-[var(--org-primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-xs text-[var(--text-muted)]">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {comments.length > 0 && (
          <section className="surface">
            <header className="border-b border-[var(--border-color)] px-4 py-2.5">
              <h2 className="text-sm font-semibold">Recent Comments</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Anonymous — shared from crew members</p>
            </header>
            <ul className="divide-y divide-[var(--border-color)]">
              {comments.map((r, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 shrink-0 text-xl">{EMOJI[r.rating]}</span>
                  <div>
                    <p className="text-sm">{r.comment}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">{r.shift_date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {rows.length === 0 && (
          <div className="surface p-10 text-center text-sm text-[var(--text-muted)]">
            No pulse responses in the last 30 days. Crew submit ratings at{" "}
            <span className="font-mono">/m/shift/pulse</span> after checkout.
          </div>
        )}
      </div>
    </>
  );
}
