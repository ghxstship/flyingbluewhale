import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type PostingRow = {
  id: string;
  title: string;
  region: string | null;
  city: string | null;
  posting_phase: string;
  posting_type: string;
  applicant_count: number;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  published_at: string | null;
  expires_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Job Postings" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("job_postings")
    .select(
      "id, title, region, city, posting_phase, posting_type, applicant_count, day_rate_min_cents, day_rate_max_cents, currency, published_at, expires_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as PostingRow[];
  const published = rows.filter((r) => r.posting_phase === "published").length;
  const drafts = rows.filter((r) => r.posting_phase === "draft").length;
  const totalApplicants = rows.reduce((s, r) => s + (r.applicant_count ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace"
        title="Job Postings"
        subtitle={`${rows.length} total · ${published} live · ${drafts} draft`}
        action={
          <Button href="/console/marketplace/postings/new" size="sm">
            + New Posting
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Live Postings" value={fmt.number(published)} accent />
          <MetricCard label="Drafts" value={fmt.number(drafts)} />
          <MetricCard label="Applicants" value={fmt.number(totalApplicants)} />
        </div>

        <DataTable<PostingRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/postings/${r.id}`}
          emptyLabel="No postings yet"
          emptyDescription="Create a posting to publish to the public crew job board."
          emptyAction={
            <Button href="/console/marketplace/postings/new" size="sm">
              + New Posting
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "type",
              header: "Type",
              render: (r) => <Badge variant="muted">{r.posting_type}</Badge>,
              accessor: (r) => r.posting_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "location",
              header: "Location",
              render: (r) => [r.city, r.region].filter(Boolean).join(", ") || "—",
              accessor: (r) => r.region ?? null,
            },
            {
              key: "rate",
              header: "Day Rate",
              render: (r) => formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency),
              accessor: (r) => Number(r.day_rate_max_cents ?? r.day_rate_min_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "applicants",
              header: "Applicants",
              render: (r) => fmt.number(r.applicant_count),
              accessor: (r) => Number(r.applicant_count ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.posting_phase] ?? "muted"}>{r.posting_phase}</Badge>,
              accessor: (r) => r.posting_phase,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
