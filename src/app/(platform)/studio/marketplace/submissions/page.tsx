import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  submission_state: string;
  score: number | null;
  fee_proposed_cents: number | null;
  submitted_at: string;
  open_call: { id: string; title: string | null } | null;
  talent_profile: { stage_name: string | null } | null;
};

/**
 * Cross-call submissions queue (kit 20 Talent · Book rail). The per-call
 * review surface stays at /studio/marketplace/calls/[callId]; this is the
 * org-wide roll-up so reviewers triage every role from one list.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.submissions.eyebrow", undefined, "Talent · Book")}
          title={t("console.submissions.title", undefined, "Submissions")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.submissions.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("open_call_submissions")
    .select(
      "id, guest_name, guest_email, submission_state, score, fee_proposed_cents, submitted_at, open_call:open_call_id(id, title), talent_profile:talent_profile_id(stage_name)",
    )
    .eq("org_id", session.orgId)
    .order("submitted_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const pending = rows.filter((r) => r.submission_state === "submitted").length;
  const reviewing = rows.filter((r) =>
    ["shortlisted", "reviewing", "under_review"].includes(r.submission_state),
  ).length;
  const awarded = rows.filter((r) => r.submission_state === "awarded").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.submissions.eyebrow", undefined, "Talent · Book")}
        title={t("console.submissions.title", undefined, "Submissions")}
        subtitle={t("console.submissions.subtitle", undefined, "Applicants against every open role, one queue.")}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid">
          <MetricCard
            label={t("console.submissions.metric.total", undefined, "Submissions")}
            value={fmt.number(rows.length)}
          />
          <MetricCard
            label={t("console.submissions.metric.pending", undefined, "Awaiting Review")}
            value={fmt.number(pending)}
            accent
          />
          <MetricCard
            label={t("console.submissions.metric.reviewing", undefined, "In Review")}
            value={fmt.number(reviewing)}
          />
          <MetricCard
            label={t("console.submissions.metric.awarded", undefined, "Booked")}
            value={fmt.number(awarded)}
          />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => (r.open_call ? `/studio/marketplace/calls/${r.open_call.id}` : "/studio/marketplace/calls")}
          emptyLabel={t("console.submissions.emptyLabel", undefined, "No submissions yet")}
          emptyDescription={t(
            "console.submissions.emptyDescription",
            undefined,
            "Post a casting call and submissions queue here per role. Booked talent flows to offers, contracts, and credentials.",
          )}
          emptyAction={
            <Button href="/studio/marketplace/calls/new" size="sm">
              {t("console.submissions.postCall", undefined, "+ Post A Casting Call")}
            </Button>
          }
          columns={[
            {
              key: "applicant",
              header: t("console.submissions.column.applicant", undefined, "Applicant"),
              render: (r) => r.talent_profile?.stage_name ?? r.guest_name ?? r.guest_email ?? "—",
              accessor: (r) => r.talent_profile?.stage_name ?? r.guest_name ?? null,
            },
            {
              key: "call",
              header: t("console.submissions.column.call", undefined, "Casting Call"),
              render: (r) => r.open_call?.title ?? "—",
              accessor: (r) => r.open_call?.title ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: t("console.submissions.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.submission_state)}>{toTitle(r.submission_state)}</Badge>,
              accessor: (r) => r.submission_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "score",
              header: t("console.submissions.column.score", undefined, "Score"),
              render: (r) => (r.score != null ? fmt.number(r.score) : "—"),
              mono: true,
              accessor: (r) => r.score,
            },
            {
              key: "fee",
              header: t("console.submissions.column.fee", undefined, "Proposed Fee"),
              render: (r) => (r.fee_proposed_cents != null ? fmt.money(r.fee_proposed_cents) : "—"),
              mono: true,
              accessor: (r) => r.fee_proposed_cents,
            },
            {
              key: "submitted",
              header: t("console.submissions.column.submitted", undefined, "Submitted"),
              render: (r) => fmt.dateParts(r.submitted_at, { month: "short", day: "numeric" }),
              mono: true,
              accessor: (r) => r.submitted_at,
            },
          ]}
        />
      </div>
    </>
  );
}
