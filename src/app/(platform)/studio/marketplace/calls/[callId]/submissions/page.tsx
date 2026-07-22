import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

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
  const fmt = await getRequestFormatters();

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
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/calls/${call.id}/submissions/${r.id}`}
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
              render: (r) => fmt.date(new Date(r.submitted_at)),
              accessor: (r) => r.submitted_at,
              mono: true,
            },
            {
              key: "submitter",
              header: t("console.marketplace.calls.submissions.col.submitter", undefined, "Submitter"),
              render: (r) => r.submitter_user_id.slice(0, 8),
              mono: true,
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
              numeric: true,
            },
            {
              key: "fee",
              header: t("console.marketplace.calls.submissions.col.proposedFee", undefined, "Proposed Fee"),
              render: (r) => (r.fee_proposed_cents ? formatMoney(r.fee_proposed_cents) : "—"),
              accessor: (r) => Number(r.fee_proposed_cents ?? 0),
              mono: true,
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
