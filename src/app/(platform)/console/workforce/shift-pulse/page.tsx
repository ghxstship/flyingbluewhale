import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { PULSE_SCORE_EMOJI, PULSE_SCORE_LABELS, type PulseScore } from "@/lib/connecteam";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type PulseRow = {
  id: string;
  score: number;
  comment: string | null;
  submitted_at: string;
  workforce_member: { full_name: string } | null;
};

const SCORE_VARIANT: Record<number, "success" | "warning" | "error" | "info" | "muted"> = {
  5: "success",
  4: "success",
  3: "info",
  2: "warning",
  1: "error",
};

export default async function Page() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.shiftPulse.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.shiftPulse.title", undefined, "Shift Pulse")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.shiftPulse.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Last 90 days of pulses.
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("shift_pulses")
    .select("id, score, comment, submitted_at, workforce_member:workforce_member_id(full_name)")
    .eq("org_id", session.orgId)
    .gte("submitted_at", since)
    .order("submitted_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as PulseRow[];

  const avgScore =
    rows.length > 0
      ? Math.round((rows.reduce((s, r) => s + r.score, 0) / rows.length) * 10) / 10
      : null;

  // Score distribution
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) dist[r.score] = (dist[r.score] ?? 0) + 1;

  const negPct =
    rows.length > 0 ? Math.round(((dist[1] + dist[2]) / rows.length) * 100) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.shiftPulse.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.shiftPulse.title", undefined, "Shift Pulse")}
        subtitle={t(
          "console.workforce.shiftPulse.subtitle",
          { count: rows.length },
          `${rows.length} submissions · last 90 days`,
        )}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.shiftPulse.avgScore", undefined, "Avg Score")}
            value={avgScore != null ? `${avgScore} / 5` : "—"}
            accent
          />
          <MetricCard
            label={t("console.workforce.shiftPulse.totalResponses", undefined, "Responses")}
            value={String(rows.length)}
          />
          <MetricCard
            label={t("console.workforce.shiftPulse.negativePct", undefined, "Negative Shifts")}
            value={negPct != null ? `${negPct}%` : "—"}
          />
        </div>

        {/* Score distribution bar */}
        {rows.length > 0 && (
          <section className="surface p-5">
            <h3 className="mb-4 text-sm font-semibold">
              {t("console.workforce.shiftPulse.distribution", undefined, "Score Distribution")}
            </h3>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as PulseScore[]).map((s) => {
                const count = dist[s] ?? 0;
                const pct = rows.length > 0 ? Math.round((count / rows.length) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-center text-base">{PULSE_SCORE_EMOJI[s]}</span>
                    <span className="w-14 text-xs text-[var(--p-text-2)]">{PULSE_SCORE_LABELS[s]}</span>
                    <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-[var(--p-surface-raised)]">
                      <div
                        className="h-full rounded-full bg-[var(--p-accent)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-mono text-xs text-[var(--p-text-2)]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold">
            {t("console.workforce.shiftPulse.recent", undefined, "Recent Submissions")}
          </h3>
          <DataTable<PulseRow>
            rows={rows}
            emptyLabel={t("console.workforce.shiftPulse.emptyLabel", undefined, "No pulse submissions yet")}
            emptyDescription={t(
              "console.workforce.shiftPulse.emptyDescription",
              undefined,
              "Crew submit a pulse rating after clocking out from the COMPVSS app.",
            )}
            columns={[
              {
                key: "member",
                header: t("console.workforce.shiftPulse.columns.member", undefined, "Member"),
                render: (r) => r.workforce_member?.full_name ?? "—",
                accessor: (r) => r.workforce_member?.full_name ?? null,
              },
              {
                key: "score",
                header: t("console.workforce.shiftPulse.columns.score", undefined, "Score"),
                render: (r) => (
                  <Badge variant={SCORE_VARIANT[r.score] ?? "muted"}>
                    {PULSE_SCORE_EMOJI[r.score as PulseScore]}{" "}
                    {PULSE_SCORE_LABELS[r.score as PulseScore]}
                  </Badge>
                ),
                filterable: true,
                groupable: true,
                accessor: (r) => String(r.score),
              },
              {
                key: "comment",
                header: t("console.workforce.shiftPulse.columns.comment", undefined, "Comment"),
                render: (r) => (
                  <span className="max-w-xs truncate text-xs text-[var(--p-text-2)]">
                    {r.comment ?? "—"}
                  </span>
                ),
                accessor: (r) => r.comment ?? null,
              },
              {
                key: "submitted_at",
                header: t("console.workforce.shiftPulse.columns.submitted", undefined, "Submitted"),
                render: (r) => (
                  <span className="font-mono text-xs">{fmt.date(r.submitted_at)}</span>
                ),
                accessor: (r) => r.submitted_at,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
