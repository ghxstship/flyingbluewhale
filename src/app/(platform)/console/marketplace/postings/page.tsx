import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type PostingRow = {
  id: string;
  title: string;
  region: string | null;
  city: string | null;
  status: string;
  posting_type: string;
  applicant_count: number;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  published_at: string | null;
  expires_at: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.postings.title", undefined, "Job Postings")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.postings.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
      "id, title, region, city, status, posting_type, applicant_count, day_rate_min_cents, day_rate_max_cents, currency, published_at, expires_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as PostingRow[];
  const published = rows.filter((r) => r.status === "published").length;
  const drafts = rows.filter((r) => r.status === "draft").length;
  const totalApplicants = rows.reduce((s, r) => s + (r.applicant_count ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.postings.title", undefined, "Job Postings")}
        subtitle={t(
          "console.marketplace.postings.subtitle",
          { total: rows.length, published, drafts },
          `${rows.length} Total · ${published} Live · ${drafts} Draft`,
        )}
        action={
          <Button href="/console/marketplace/postings/new" size="sm">
            {t("console.marketplace.postings.newPosting", undefined, "+ New Posting")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.marketplace.postings.metric.livePostings", undefined, "Live Postings")}
            value={fmt.number(published)}
            accent
          />
          <MetricCard
            label={t("console.marketplace.postings.metric.drafts", undefined, "Drafts")}
            value={fmt.number(drafts)}
          />
          <MetricCard
            label={t("console.marketplace.postings.metric.applicants", undefined, "Applicants")}
            value={fmt.number(totalApplicants)}
          />
        </div>

        <DataTable<PostingRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/postings/${r.id}`}
          emptyLabel={t("console.marketplace.postings.emptyLabel", undefined, "No postings yet")}
          emptyDescription={t(
            "console.marketplace.postings.emptyDescription",
            undefined,
            "Create a posting to publish to the public crew job board.",
          )}
          emptyAction={
            <Button href="/console/marketplace/postings/new" size="sm">
              {t("console.marketplace.postings.newPosting", undefined, "+ New Posting")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.marketplace.postings.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "type",
              header: t("console.marketplace.postings.col.type", undefined, "Type"),
              render: (r) => <Badge variant="muted">{toTitle(r.posting_type)}</Badge>,
              accessor: (r) => r.posting_type,
              filterable: true,
              groupable: true,
            },
            {
              key: "location",
              header: t("console.marketplace.postings.col.location", undefined, "Location"),
              render: (r) => [r.city, r.region].filter(Boolean).join(", ") || "—",
              accessor: (r) => r.region ?? null,
            },
            {
              key: "rate",
              header: t("console.marketplace.postings.col.dayRate", undefined, "Day Rate"),
              render: (r) => formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency),
              accessor: (r) => Number(r.day_rate_max_cents ?? r.day_rate_min_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "applicants",
              header: t("console.marketplace.postings.col.applicants", undefined, "Applicants"),
              render: (r) => fmt.number(r.applicant_count),
              accessor: (r) => Number(r.applicant_count ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "status",
              header: t("console.marketplace.postings.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
