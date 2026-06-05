import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  submitter_user_id: string;
  status: string;
  score: number | null;
  fee_proposed_cents: number | null;
  cover_note: string | null;
  submitted_at: string;
};

export default async function Page({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [callResp, subsResp] = await Promise.all([
    supabase
      .from("open_calls")
      .select("id, title, submission_count")
      .eq("id", callId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("open_call_submissions")
      .select("id, submitter_user_id, status, score, fee_proposed_cents, cover_note, submitted_at")
      .eq("open_call_id", callId)
      .eq("org_id", session.orgId)
      .order("submitted_at", { ascending: false })
      .limit(500),
  ]);
  if (!callResp.data) return notFound();
  const call = callResp.data as { id: string; title: string; submission_count: number };
  const rows = (subsResp.data ?? []) as Row[];

  // Lead Insights — GigSalad parity: competitive intelligence at a glance
  const total = rows.length;
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const scoredRows = rows.filter((r) => r.score != null);
  const avgScore = scoredRows.length ? Math.round(scoredRows.reduce((s, r) => s + (r.score ?? 0), 0) / scoredRows.length) : null;
  const feeRows = rows.filter((r) => r.fee_proposed_cents != null);
  const avgFee = feeRows.length ? Math.round(feeRows.reduce((s, r) => s + (r.fee_proposed_cents ?? 0), 0) / feeRows.length) : null;
  const dates = rows.map((r) => new Date(r.submitted_at).getTime()).sort((a, b) => a - b);
  const velocityDays = dates.length >= 2 ? Math.round((dates[dates.length - 1] - dates[0]) / 86_400_000) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.calls.submissions.eyebrow", { title: call.title }, `Call · ${call.title}`)}
        title={t("console.marketplace.calls.submissions.title", undefined, "Submissions")}
        subtitle={t(
          "console.marketplace.calls.submissions.subtitle",
          { total: rows.length, unreviewed: rows.filter((r) => r.status === "submitted").length },
          `${rows.length} Total · ${rows.filter((r) => r.status === "submitted").length} unreviewed`,
        )}
      />
      <div className="page-content space-y-5">
        {total > 0 && (
          <div className="surface rounded-xl p-5 border border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              {t("console.marketplace.calls.submissions.insights.heading", undefined, "Lead Insights")}
            </p>
            <div className="metric-grid">
              <div>
                <p className="text-2xl font-bold tabular-nums">{total}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.calls.submissions.insights.total", undefined, "Total Submissions")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{byStatus["submitted"] ?? 0}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.calls.submissions.insights.pending", undefined, "Pending Review")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{byStatus["shortlisted"] ?? 0}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.calls.submissions.insights.shortlisted", undefined, "Shortlisted")}
                </p>
              </div>
              {avgScore != null && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">{avgScore}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t("console.marketplace.calls.submissions.insights.avgScore", undefined, "Avg Score")}
                  </p>
                </div>
              )}
              {avgFee != null && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">{formatMoney(avgFee)}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t("console.marketplace.calls.submissions.insights.avgFee", undefined, "Avg Proposed Fee")}
                  </p>
                </div>
              )}
              {velocityDays != null && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">{velocityDays}d</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t("console.marketplace.calls.submissions.insights.spread", undefined, "Response Spread")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/marketplace/calls/${call.id}/submissions/${r.id}`}
          emptyLabel={t("console.marketplace.calls.submissions.emptyLabel", undefined, "No submissions yet")}
          emptyDescription={t(
            "console.marketplace.calls.submissions.emptyDescription",
            undefined,
            "Once published, submissions appear here.",
          )}
          columns={[
            {
              key: "when",
              header: t("console.marketplace.calls.submissions.col.submitted", undefined, "Submitted"),
              render: (r) => new Date(r.submitted_at).toLocaleDateString(),
              accessor: (r) => r.submitted_at,
              className: "font-mono text-xs",
            },
            {
              key: "submitter",
              header: t("console.marketplace.calls.submissions.col.submitter", undefined, "Submitter"),
              render: (r) => <span className="font-mono text-xs">{r.submitter_user_id.slice(0, 8)}</span>,
              accessor: (r) => r.submitter_user_id,
            },
            {
              key: "status",
              header: t("console.marketplace.calls.submissions.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "score",
              header: t("console.marketplace.calls.submissions.col.score", undefined, "Score"),
              render: (r) => (r.score == null ? "—" : `${r.score}`),
              accessor: (r) => Number(r.score ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "fee",
              header: t("console.marketplace.calls.submissions.col.proposedFee", undefined, "Proposed Fee"),
              render: (r) => (r.fee_proposed_cents ? formatMoney(r.fee_proposed_cents) : "—"),
              accessor: (r) => Number(r.fee_proposed_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "cover",
              header: t("console.marketplace.calls.submissions.col.note", undefined, "Note"),
              render: (r) => (r.cover_note ? r.cover_note.slice(0, 80) + (r.cover_note.length > 80 ? "…" : "") : "—"),
              accessor: (r) => r.cover_note ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
