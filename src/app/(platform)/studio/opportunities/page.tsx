import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Opportunities (kit 21 remediation R2, ADR-0015) — the business-development
 * lens over the ONE CRM store: `opportunities` filtered to kind='rfp', with
 * the `bd_type` facet (Public RFP · Invited Bid · Tender · Renewal ·
 * Partnership). This resolves the "where does Opportunities live" ambiguity —
 * it's a filtered view of `crm`, a sibling of the deals pipeline and the leads
 * lens, not a new noun. Won bizdev converts into the deal pipeline via CRM.
 */
const BD_LABEL: Record<string, string> = {
  public_rfp: "Public RFP",
  invited_bid: "Invited Bid",
  tender: "Tender",
  renewal: "Renewal",
  partnership: "Partnership",
};

type Row = {
  id: string;
  title: string;
  bd_type: string | null;
  estimated_value_minor: number | null;
  estimated_value_currency: string | null;
  expected_close: string | null;
  close_outcome: string | null;
  source: string | null;
};

export default async function OpportunitiesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.opportunities.eyebrow", undefined, "Sales · Business Development")}
          title={t("console.opportunities.title", undefined, "Opportunities")}
        />
        <div className="page-content text-sm">{t("console.opportunities.configureSupabase", undefined, "Configure Supabase.")}</div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("opportunities")
    .select("id, title, bd_type, estimated_value_minor, estimated_value_currency, expected_close, close_outcome, source")
    .eq("org_id", session.orgId)
    .eq("kind", "rfp")
    .order("expected_close", { ascending: true, nullsFirst: false })
    .limit(300);
  const rows = (data ?? []) as Row[];

  const open = rows.filter((r) => !r.close_outcome).length;
  const totalValue = rows
    .filter((r) => !r.close_outcome)
    .reduce((sum, r) => sum + (r.estimated_value_minor ?? 0), 0);
  const won = rows.filter((r) => r.close_outcome === "won").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.opportunities.eyebrow", undefined, "Sales · Business Development")}
        title={t("console.opportunities.title", undefined, "Opportunities")}
        info={t(
          "console.opportunities.info",
          undefined,
          "Public RFPs, invited bids, tenders, renewals, and partnerships — the pursuit pipeline before a deal exists. A lens over the CRM store (kind = RFP).",
        )}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard label={t("console.opportunities.metric.open", undefined, "Open Pursuits")} value={String(open)} accent />
          <MetricCard
            label={t("console.opportunities.metric.value", undefined, "Est. Open Value")}
            value={formatMoney(totalValue, rows[0]?.estimated_value_currency ?? "USD")}
          />
          <MetricCard label={t("console.opportunities.metric.won", undefined, "Won")} value={String(won)} />
        </div>

        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/pipeline/${r.id}`}
          emptyLabel={t("console.opportunities.emptyLabel", undefined, "No opportunities yet")}
          emptyDescription={t(
            "console.opportunities.emptyDescription",
            undefined,
            "Public RFPs, invited bids, tenders, renewals, and partnerships live here. Add one from the CRM as an RFP-kind record.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.opportunities.col.title", undefined, "Opportunity"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "bd_type",
              header: t("console.opportunities.col.type", undefined, "Type"),
              render: (r) =>
                r.bd_type ? <Badge variant="muted">{BD_LABEL[r.bd_type] ?? r.bd_type}</Badge> : <span className="text-[var(--p-text-3)]">—</span>,
              accessor: (r) => r.bd_type ?? "",
              filterable: true,
              groupable: true,
            },
            {
              key: "value",
              header: t("console.opportunities.col.value", undefined, "Est. Value"),
              render: (r) =>
                r.estimated_value_minor != null
                  ? formatMoney(r.estimated_value_minor, r.estimated_value_currency ?? "USD")
                  : "—",
              accessor: (r) => r.estimated_value_minor ?? 0,
            },
            {
              key: "close",
              header: t("console.opportunities.col.close", undefined, "Expected Close"),
              render: (r) => r.expected_close ?? "—",
              accessor: (r) => r.expected_close ?? "",
            },
            {
              key: "outcome",
              header: t("console.opportunities.col.outcome", undefined, "Outcome"),
              render: (r) =>
                r.close_outcome ? (
                  <Badge variant={r.close_outcome === "won" ? "success" : "muted"}>{r.close_outcome}</Badge>
                ) : (
                  <Badge variant="warning">{t("console.opportunities.openBadge", undefined, "Open")}</Badge>
                ),
              accessor: (r) => r.close_outcome ?? "open",
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
