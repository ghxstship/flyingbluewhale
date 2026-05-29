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
import { AiMatchPanel } from "./AiMatchPanel";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  submitter_user_id: string;
  status: string;
  score: number | null;
  ai_match_score: number | null;
  ai_match_notes: string | null;
  fee_proposed_cents: number | null;
  cover_note: string | null;
  submitted_at: string;
};

export default async function Page({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const [callResp, subsResp] = await Promise.all([
    supabase
      .from("open_calls")
      .select("id, title, submission_count")
      .eq("id", callId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("open_call_submissions")
      .select("id, submitter_user_id, status, score, ai_match_score, ai_match_notes, fee_proposed_cents, cover_note, submitted_at")
      .eq("open_call_id", callId)
      .eq("org_id", session.orgId)
      .order("submitted_at", { ascending: false })
      .limit(500),
  ]);
  if (!callResp.data) return notFound();
  const call = callResp.data as { id: string; title: string; submission_count: number };
  const rows = (subsResp.data ?? []) as Row[];

  const scoredCount = rows.filter((r) => r.ai_match_score != null).length;

  return (
    <>
      <ModuleHeader
        eyebrow={`Call · ${call.title}`}
        title="Submissions"
        subtitle={`${rows.length} Total · ${rows.filter((r) => r.status === "submitted").length} unreviewed · ${scoredCount} AI-scored`}
        action={
          <Button href={`/console/marketplace/calls/${callId}`} size="sm" variant="ghost">
            ← Call
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <AiMatchPanel callId={callId} submissionIds={rows.map((r) => r.id)} scoredCount={scoredCount} />
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/marketplace/calls/${call.id}/submissions/${r.id}`}
          emptyLabel="No submissions yet"
          emptyDescription="Once published, submissions appear here."
          columns={[
            {
              key: "when",
              header: "Submitted",
              render: (r) => new Date(r.submitted_at).toLocaleDateString(),
              accessor: (r) => r.submitted_at,
              className: "font-mono text-xs",
            },
            {
              key: "submitter",
              header: "Submitter",
              render: (r) => <span className="font-mono text-xs">{r.submitter_user_id.slice(0, 8)}</span>,
              accessor: (r) => r.submitter_user_id,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "score",
              header: "Score",
              render: (r) => (r.score == null ? "—" : `${r.score}`),
              accessor: (r) => Number(r.score ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "ai_score",
              header: "AI Match",
              render: (r) =>
                r.ai_match_score != null ? (
                  <span
                    className={
                      r.ai_match_score >= 80
                        ? "font-mono text-xs font-semibold text-[var(--success)]"
                        : r.ai_match_score >= 60
                          ? "font-mono text-xs"
                          : "font-mono text-xs text-[var(--text-muted)]"
                    }
                    title={r.ai_match_notes ?? undefined}
                  >
                    {r.ai_match_score.toFixed(0)}
                  </span>
                ) : (
                  <span className="text-[var(--text-muted)] text-xs">—</span>
                ),
              accessor: (r) => Number(r.ai_match_score ?? -1),
              className: "font-mono text-xs tabular-nums text-right",
            },
            {
              key: "fee",
              header: "Proposed Fee",
              render: (r) => (r.fee_proposed_cents ? formatMoney(r.fee_proposed_cents) : "—"),
              accessor: (r) => Number(r.fee_proposed_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "cover",
              header: "Note",
              render: (r) => (r.cover_note ? r.cover_note.slice(0, 80) + (r.cover_note.length > 80 ? "…" : "") : "—"),
              accessor: (r) => r.cover_note ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
