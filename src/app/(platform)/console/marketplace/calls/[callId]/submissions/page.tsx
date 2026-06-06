import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { scoreSubmissionsAction } from "./scoreActions";

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
  const unscored = rows.filter((r) => r.score == null).length;

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
        actions={
          unscored > 0 ? (
            <form action={scoreSubmissionsAction}>
              <input type="hidden" name="call_id" value={callId} />
              <Button type="submit" variant="secondary" size="sm">
                {t(
                  "console.marketplace.calls.submissions.scoreAi",
                  { count: unscored },
                  `Score ${unscored} with AI`,
                )}
              </Button>
            </form>
          ) : undefined
        }
      />
      <div className="page-content space-y-5">
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
              header: t("console.marketplace.calls.submissions.col.score", undefined, "AI Score"),
              render: (r) =>
                r.score == null ? (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ) : (
                  <Badge
                    variant={r.score >= 75 ? "success" : r.score >= 50 ? "info" : "muted"}
                    title={`AI match score: ${r.score}/100`}
                  >
                    {r.score}
                  </Badge>
                ),
              accessor: (r) => Number(r.score ?? 0),
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
