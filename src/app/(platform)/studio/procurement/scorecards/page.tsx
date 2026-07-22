import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  name: string;
  w9_on_file: boolean;
  coi_expires_at: string | null;
};

type POAggRow = {
  vendor_id: string;
  amount_cents: number;
  po_state: string;
};

const COMPLIANCE_DAYS = 30;

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.scorecards.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.scorecards.title", undefined, "Supplier Scorecards")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.scorecards.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: vendorData }, { data: poData }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name, w9_on_file, coi_expires_at")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("purchase_orders")
      .select("vendor_id, amount_cents, po_state")
      .eq("org_id", session.orgId)
      .not("vendor_id", "is", null)
      .limit(5000),
  ]);

  const vendors = (vendorData ?? []) as VendorRow[];
  const pos = (poData ?? []) as POAggRow[];

  const aggByVendor = pos.reduce<Map<string, { count: number; total: number; fulfilled: number; cancelled: number }>>(
    (map, p) => {
      const acc = map.get(p.vendor_id) ?? { count: 0, total: 0, fulfilled: 0, cancelled: 0 };
      acc.count += 1;
      acc.total += p.amount_cents;
      if (p.po_state === "fulfilled") acc.fulfilled += 1;
      if (p.po_state === "cancelled") acc.cancelled += 1;
      map.set(p.vendor_id, acc);
      return map;
    },
    new Map(),
  );

  const now = Date.now();
  const expiringSoon = vendors.filter(
    (v) => v.coi_expires_at && new Date(v.coi_expires_at).getTime() - now < COMPLIANCE_DAYS * 24 * 60 * 60 * 1000,
  ).length;
  const w9Pct =
    vendors.length > 0 ? Math.round((vendors.filter((v) => v.w9_on_file).length / vendors.length) * 100) : 0;
  const totalSpend = pos.reduce((s, p) => s + p.amount_cents, 0);

  // Sort vendors by total spend descending for the scorecard table
  const ranked = [...vendors].sort((a, b) => {
    const aSpend = aggByVendor.get(a.id)?.total ?? 0;
    const bSpend = aggByVendor.get(b.id)?.total ?? 0;
    return bSpend - aSpend;
  });

  type ScorecardRow = {
    id: string;
    name: string;
    poCount: number;
    spend: number;
    fulfilledPct: number | null;
    w9OnFile: boolean;
    coiExpiring: boolean;
  };
  const scorecardRows: ScorecardRow[] = ranked.slice(0, 50).map((v) => {
    const agg = aggByVendor.get(v.id) ?? { count: 0, total: 0, fulfilled: 0, cancelled: 0 };
    return {
      id: v.id,
      name: v.name,
      poCount: agg.count,
      spend: agg.total,
      fulfilledPct: agg.count > 0 ? Math.round((agg.fulfilled / agg.count) * 100) : null,
      w9OnFile: v.w9_on_file,
      coiExpiring: Boolean(
        v.coi_expires_at && new Date(v.coi_expires_at).getTime() - now < COMPLIANCE_DAYS * 24 * 60 * 60 * 1000,
      ),
    };
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.scorecards.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.scorecards.title", undefined, "Supplier Scorecards")}
        subtitle={t(
          "console.procurement.scorecards.subtitle",
          {
            count: vendors.length,
            vendorLabel: vendors.length === 1 ? "Vendor" : "Vendors",
            spend: formatMoney(totalSpend),
            w9Pct,
          },
          `${vendors.length} Vendor${vendors.length === 1 ? "" : "s"} · ${formatMoney(totalSpend)} Lifetime Spend · ${w9Pct}% W-9 on file`,
        )}
        action={
          <Button href="/studio/procurement/vendors" size="sm">
            {t("console.procurement.scorecards.allVendors", undefined, "All vendors")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.scorecards.metric.vendors", undefined, "Vendors")}
            value={fmt.number(vendors.length)}
            accent
          />
          <MetricCard
            label={t("console.procurement.scorecards.metric.w9OnFile", undefined, "W-9 on file")}
            value={`${w9Pct}%`}
          />
          <MetricCard
            label={t("console.procurement.scorecards.metric.coiExpiring", undefined, "COI expiring · 30d")}
            value={fmt.number(expiringSoon)}
          />
        </div>

        <DataView<ScorecardRow>
          rows={scorecardRows}
          tableId="console:procurement:scorecards"
          totalCount={ranked.length}
          rowHref={(v) => `/studio/procurement/vendors/${v.id}`}
          emptyLabel={t("console.procurement.scorecards.empty.title", undefined, "No Vendors Yet")}
          emptyDescription={t(
            "console.procurement.scorecards.empty.description",
            undefined,
            "Author vendors via Procurement → Vendors. Scorecards rank them by PO volume + compliance.",
          )}
          emptyAction={
            <Link href="/studio/procurement/vendors" className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.procurement.scorecards.empty.cta", undefined, "Open vendors")}
            </Link>
          }
          columns={[
            {
              key: "vendor",
              header: t("console.procurement.scorecards.col.vendor", undefined, "Vendor"),
              render: (v) => <span className="font-medium">{v.name}</span>,
              accessor: (v) => v.name,
            },
            {
              key: "pos",
              header: t("console.procurement.scorecards.col.pos", undefined, "POs"),
              render: (v) => v.poCount,
              accessor: (v) => v.poCount,
              tabular: true,
              total: "sum",
            },
            {
              key: "spend",
              header: t("console.procurement.scorecards.col.spend", undefined, "Spend"),
              render: (v) => formatMoney(v.spend),
              accessor: (v) => v.spend,
              tabular: true,
              total: "sum",
              // Serializable spec — a closure here cannot cross the RSC
              // boundary (B0_PARITY.md §Hazards, fixed in B1).
              totalFormat: { style: "money" },
            },
            {
              key: "fulfilled",
              header: t("console.procurement.scorecards.col.fulfilled", undefined, "Fulfilled"),
              render: (v) => (v.fulfilledPct != null ? `${v.fulfilledPct}%` : "—"),
              accessor: (v) => v.fulfilledPct ?? null,
              tabular: true,
            },
            {
              key: "compliance",
              header: t("console.procurement.scorecards.col.compliance", undefined, "Compliance"),
              render: (v) => (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={v.w9OnFile ? "success" : "warning"}>
                    {v.w9OnFile
                      ? t("console.procurement.scorecards.badge.w9", undefined, "W-9")
                      : t("console.procurement.scorecards.badge.noW9", undefined, "No W-9")}
                  </Badge>
                  {v.coiExpiring && (
                    <Badge variant="error">
                      {t("console.procurement.scorecards.badge.coiExpiring", undefined, "COI expiring")}
                    </Badge>
                  )}
                </div>
              ),
              accessor: (v) => (v.w9OnFile ? "w9" : "no-w9"),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
