import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const MOOD_LABEL = ["", "Rough", "Tough", "OK", "Good", "Great"] as const;
const MOOD_TONE = [
  "",
  "error",
  "warning",
  "muted",
  "success",
  "success",
] as const satisfies readonly ("" | "error" | "warning" | "muted" | "success")[];

type Row = {
  id: string;
  time_entry_id: string;
  user_id: string;
  mood: number;
  energy: number | null;
  safety_rating: number | null;
  comment: string | null;
  anonymous: boolean;
  created_at: string;
};

export default async function ShiftFeedbackPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Shift Feedback" />
        <div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: rows } = await supabase
    .from("shift_feedback")
    .select("id, time_entry_id, user_id, mood, energy, safety_rating, comment, anonymous, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const feedback = (rows ?? []) as Row[];

  const avgMood =
    feedback.length > 0
      ? (feedback.reduce((s, r) => s + r.mood, 0) / feedback.length).toFixed(1)
      : null;
  const avgSafety =
    feedback.filter((r) => r.safety_rating !== null).length > 0
      ? (
          feedback.filter((r) => r.safety_rating !== null).reduce((s, r) => s + (r.safety_rating ?? 0), 0) /
          feedback.filter((r) => r.safety_rating !== null).length
        ).toFixed(1)
      : null;

  const comments = feedback.filter((r) => r.comment);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Shift Feedback"
        subtitle="Post-shift Pulse — Deputy Shift Pulse+ parity"
      />
      <div className="page-content space-y-6">
        {/* Aggregate metrics */}
        <div className="metric-grid">
          <div className="surface p-4 rounded-xl">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Avg Mood</p>
            <p className="mt-1 text-3xl font-bold">{avgMood ?? "—"}<span className="text-base font-normal text-[var(--text-muted)]"> / 5</span></p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{feedback.length} responses</p>
          </div>
          <div className="surface p-4 rounded-xl">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Avg Safety</p>
            <p className="mt-1 text-3xl font-bold">{avgSafety ?? "—"}<span className="text-base font-normal text-[var(--text-muted)]"> / 5</span></p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{feedback.filter((r) => r.safety_rating !== null).length} with safety rating</p>
          </div>
          <div className="surface p-4 rounded-xl">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">With Comments</p>
            <p className="mt-1 text-3xl font-bold">{comments.length}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{feedback.length > 0 ? Math.round((comments.length / feedback.length) * 100) : 0}% response rate</p>
          </div>
        </div>

        {/* Comments feed */}
        {comments.length > 0 && (
          <div className="surface rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-medium">Comments</h2>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {comments.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{r.comment}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {r.anonymous ? "Anonymous" : `User`} · {fmt.date(r.created_at)}
                      </p>
                    </div>
                    <Badge variant={MOOD_TONE[r.mood] as "error" | "warning" | "muted" | "success"}>{MOOD_LABEL[r.mood]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full log */}
        <div className="surface rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h2 className="font-medium">All responses</h2>
          </div>
          {feedback.length === 0 ? (
            <EmptyState title="No feedback yet" description="Feedback appears here after crew submit Shift Pulse responses." />
          ) : (
            <div className="data-table">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Submitted</th>
                    <th className="text-left">Mood</th>
                    <th className="text-left">Energy</th>
                    <th className="text-left">Safety</th>
                    <th className="text-left">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map((r) => (
                    <tr key={r.id}>
                      <td className="text-[var(--text-muted)]">{fmt.date(r.created_at)}</td>
                      <td>
                        <Badge variant={MOOD_TONE[r.mood] as "error" | "warning" | "muted" | "success"}>{MOOD_LABEL[r.mood]}</Badge>
                      </td>
                      <td>{r.energy ?? "—"}</td>
                      <td>{r.safety_rating ?? "—"}</td>
                      <td className="max-w-xs truncate text-[var(--text-muted)]">{r.comment ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
