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
  submission_state: string;
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
      .select("id, submitter_user_id, submission_state, score, fee_proposed_cents, cover_note, submitted_at")
      .eq("open_call_id", callId)
      .eq("org_id", session.orgId)
      .order("submitted_at", { ascending: false })
      .limit(500),
  ]);
  if (!callResp.data) return notFound();
  const call = callResp.data as { id: string; title: string; submission_count: number };
  const rows = (subsResp.data ?? []) as Row[];

  // Competitive Insights (GigSalad Lead Insights parity) — computed server-side
  const total = rows.length;
  const byState = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.submission_state] = (acc[r.submission_state] ?? 0) + 1;
    return acc;
  }, {});
  const scored = rows.filter((r) => r.score != null);
  const avgScore = scored.length > 0 ? scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length : null;
  const priced = rows.filter((r) => r.fee_proposed_cents != null);
  const avgFee =
    priced.length > 0 ? priced.reduce((s, r) => s + (r.fee_proposed_cents ?? 0), 0) / priced.length : null;
  const unreviewed = byState["submitted"] ?? 0;
  const shortlisted = (byState["shortlisted"] ?? 0) + (byState["approved"] ?? 0);
  const declined = byState["declined"] ?? 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.calls.submissions.eyebrow", { title: call.title }, `Call · ${call.title}`)}
        title={t("console.marketplace.calls.submissions.title", undefined, "Submissions")}
        subtitle={t(
          "console.marketplace.calls.submissions.subtitle",
          { total: rows.length, unreviewed: rows.filter((r) => r.submission_state === "submitted").length },
          `${rows.length} Total · ${rows.filter((r) => r.submission_state === "submitted").length} unreviewed`,
        )}
      />
      <div className="page-content space-y-5">
        {/* Competitive insights panel — shows how the call is performing */}
        {total > 0 && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.insights.total", undefined, "Total")}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{total}</p>
            </div>
            <div className="surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.insights.unreviewed", undefined, "Unreviewed")}
              </p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${unreviewed > 0 ? "text-[var(--p-warning)]" : ""}`}>
                {unreviewed}
              </p>
            </div>
            <div className="surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.insights.shortlisted", undefined, "Shortlisted")}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--p-success)]">{shortlisted}</p>
            </div>
            <div className="surface p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
                {t("console.marketplace.calls.submissions.insights.declined", undefined, "Declined")}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{declined}</p>
            </div>
            {avgScore != null && (
              <div className="surface p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
                  {t("console.marketplace.calls.submissions.insights.avgScore", undefined, "Avg Score")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{avgScore.toFixed(1)}</p>
              </div>
            )}
            {avgFee != null && (
              <div className="surface p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
                  {t("console.marketplace.calls.submissions.insights.avgProposedFee", undefined, "Avg Proposed Fee")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(Math.round(avgFee))}</p>
              </div>
            )}
          </section>
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
              key: "submission_state",
              header: t("console.marketplace.calls.submissions.col.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.submission_state] ?? "muted"}>{toTitle(r.submission_state)}</Badge>
              ),
              accessor: (r) => r.submission_state,
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
