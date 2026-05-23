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

const KIND_LABEL: Record<string, string> = {
  talent_call: "Talent Call",
  audition: "Audition",
  gig: "Gig",
  rfq: "Public RFQ",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

type CallRow = {
  id: string;
  title: string;
  kind: string;
  region: string | null;
  status: string;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  submission_count: number;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Marketplace" title="Open Calls" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
    .select("id, title, kind, region, status, fee_min_cents, fee_max_cents, currency, deadline_at, submission_count")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as CallRow[];
  const published = rows.filter((r) => r.status === "published").length;
  const totalSubs = rows.reduce((s, r) => s + (r.submission_count ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace"
        title="Open Calls"
        subtitle={`${rows.length} Total · ${published} Live · ${totalSubs} Submissions`}
        action={
          <Button href="/console/marketplace/calls/new" size="sm">
            + New Call
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Live Calls" value={fmt.number(published)} accent />
          <MetricCard label="Submissions" value={fmt.number(totalSubs)} />
          <MetricCard label="Total Calls" value={fmt.number(rows.length)} />
        </div>

        <DataTable<CallRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/calls/${r.id}`}
          emptyLabel="No open calls yet"
          emptyDescription="Open calls invite talent, vendors, or crew to submit."
          emptyAction={
            <Button href="/console/marketplace/calls/new" size="sm">
              + New Call
            </Button>
          }
          columns={[
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "kind",
              header: "Kind",
              render: (r) => <Badge variant="muted">{KIND_LABEL[r.kind] ?? r.kind}</Badge>,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            { key: "region", header: "Region", render: (r) => r.region ?? "—", accessor: (r) => r.region ?? null },
            {
              key: "fee",
              header: "Fee Band",
              render: (r) => formatFeeRange(r.fee_min_cents, r.fee_max_cents, r.currency),
              accessor: (r) => Number(r.fee_max_cents ?? r.fee_min_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "deadline",
              header: "Deadline",
              render: (r) => fmtDate(r.deadline_at),
              accessor: (r) => r.deadline_at,
              className: "font-mono text-xs",
            },
            {
              key: "subs",
              header: "Submissions",
              render: (r) => fmt.number(r.submission_count ?? 0),
              accessor: (r) => Number(r.submission_count ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{STATUS_LABEL[r.status] ?? r.status}</Badge>
              ),
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
