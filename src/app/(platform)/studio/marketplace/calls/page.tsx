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

export const dynamic = "force-dynamic";

type CallRow = {
  id: string;
  title: string;
  kind: string;
  region: string | null;
  open_call_phase: string;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  submission_count: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  const KIND_LABEL: Record<string, string> = {
    talent_call: t("console.marketplace.calls.kind.talentCall", undefined, "Talent Call"),
    audition: t("console.marketplace.calls.kind.audition", undefined, "Audition"),
    gig: t("console.marketplace.calls.kind.gig", undefined, "Gig"),
    rfq: t("console.marketplace.calls.kind.rfq", undefined, "Public RFQ"),
  };
  const STATUS_LABEL: Record<string, string> = {
    draft: t("console.marketplace.calls.status.draft", undefined, "Draft"),
    published: t("console.marketplace.calls.status.published", undefined, "Published"),
    closed: t("console.marketplace.calls.status.closed", undefined, "Closed"),
    archived: t("console.marketplace.calls.status.archived", undefined, "Archived"),
  };
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.calls.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.calls.title", undefined, "Open Calls")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.calls.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string | null) =>
    iso ? fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" }) : "—";

  const { data } = await supabase
    .from("open_calls")
    .select(
      "id, title, kind, region, open_call_phase, fee_min_cents, fee_max_cents, currency, deadline_at, submission_count",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as CallRow[];
  const published = rows.filter((r) => r.open_call_phase === "published").length;
  const totalSubs = rows.reduce((s, r) => s + (r.submission_count ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.calls.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.calls.title", undefined, "Open Calls")}
        subtitle={t(
          "console.marketplace.calls.subtitle",
          { total: fmt.number(rows.length), live: fmt.number(published), subs: fmt.number(totalSubs) },
          `${rows.length} Total · ${published} Live · ${totalSubs} Submissions`,
        )}
        action={
          <Button href="/studio/marketplace/calls/new" size="sm">
            {t("console.marketplace.calls.newCall", undefined, "+ New Call")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.marketplace.calls.metric.liveCalls", undefined, "Live Calls")}
            value={fmt.number(published)}
            accent
          />
          <MetricCard
            label={t("console.marketplace.calls.metric.submissions", undefined, "Submissions")}
            value={fmt.number(totalSubs)}
          />
          <MetricCard
            label={t("console.marketplace.calls.metric.totalCalls", undefined, "Total Calls")}
            value={fmt.number(rows.length)}
          />
        </div>

        <DataTable<CallRow>
          rows={rows}
          rowHref={(r) => `/studio/marketplace/calls/${r.id}`}
          emptyLabel={t("console.marketplace.calls.empty.label", undefined, "No open calls yet")}
          emptyDescription={t(
            "console.marketplace.calls.empty.description",
            undefined,
            "Open calls invite talent, vendors, or crew to submit.",
          )}
          emptyAction={
            <Button href="/studio/marketplace/calls/new" size="sm">
              {t("console.marketplace.calls.newCall", undefined, "+ New Call")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.marketplace.calls.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "kind",
              header: t("console.marketplace.calls.col.kind", undefined, "Kind"),
              render: (r) => <Badge variant="muted">{KIND_LABEL[r.kind] ?? r.kind}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "region",
              header: t("console.marketplace.calls.col.region", undefined, "Region"),
              render: (r) => r.region ?? "—",
              accessor: (r) => r.region ?? null,
            },
            {
              key: "fee",
              header: t("console.marketplace.calls.col.feeBand", undefined, "Fee Band"),
              render: (r) => formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
              accessor: (r) => Number(r.fee_max_cents ?? r.fee_min_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "deadline",
              header: t("console.marketplace.calls.col.deadline", undefined, "Deadline"),
              render: (r) => fmtDate(r.deadline_at),
              accessor: (r) => r.deadline_at,
              className: "font-mono text-xs",
            },
            {
              key: "subs",
              header: t("console.marketplace.calls.col.submissions", undefined, "Submissions"),
              render: (r) => fmt.number(r.submission_count ?? 0),
              accessor: (r) => Number(r.submission_count ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "open_call_phase",
              header: t("console.marketplace.calls.col.status", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.open_call_phase] ?? "muted"}>
                  {STATUS_LABEL[r.open_call_phase] ?? r.open_call_phase}
                </Badge>
              ),
              accessor: (r) => r.open_call_phase,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
