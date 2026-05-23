import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AppRow = {
  id: string;
  applicant_user_id: string;
  status: string;
  score: number | null;
  day_rate_proposed_cents: number | null;
  applied_at: string;
  cover_note: string | null;
};

export default async function Page({ params }: { params: Promise<{ postingId: string }> }) {
  const { postingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string) => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });

  const [postingResp, appsResp] = await Promise.all([
    supabase
      .from("job_postings")
      .select("id, title, applicant_count, status")
      .eq("id", postingId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("job_applications")
      .select("id, applicant_user_id, status, score, day_rate_proposed_cents, applied_at, cover_note")
      .eq("job_posting_id", postingId)
      .eq("org_id", session.orgId)
      .order("applied_at", { ascending: false })
      .limit(500),
  ]);
  if (!postingResp.data) return notFound();
  const posting = postingResp.data as { id: string; title: string; applicant_count: number; status: string };
  const rows = (appsResp.data ?? []) as AppRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={`Marketplace · ${posting.title}`}
        title="Applicants"
        subtitle={`${rows.length} Total · ${rows.filter((r) => r.status === "new").length} unreviewed`}
      />
      <div className="page-content space-y-5">
        <DataTable<AppRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/postings/${posting.id}/applicants/${r.id}`}
          emptyLabel="No applicants yet"
          emptyDescription="Once published, applications appear here."
          columns={[
            {
              key: "applied",
              header: "Applied",
              render: (r) => fmtDate(r.applied_at),
              accessor: (r) => r.applied_at,
              className: "font-mono text-xs",
            },
            {
              key: "applicant",
              header: "Applicant",
              render: (r) => <span className="font-mono text-xs">{r.applicant_user_id.slice(0, 8)}</span>,
              accessor: (r) => r.applicant_user_id,
            },
            {
              key: "status",
              header: "Stage",
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
              key: "rate",
              header: "Proposed Rate",
              render: (r) => (r.day_rate_proposed_cents ? `$${(r.day_rate_proposed_cents / 100).toFixed(0)}` : "—"),
              accessor: (r) => Number(r.day_rate_proposed_cents ?? 0),
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
