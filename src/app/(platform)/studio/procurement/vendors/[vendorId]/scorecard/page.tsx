import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  // Compute a scorecard from concrete signals: PO fulfillment, change-order
  // rate, submittal approval rate. No standalone scorecards table — this is
  // derived. Keeps the user honest about source data.
  const [{ data: pos }, { data: subs }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id,po_state,amount_cents")
      .eq("org_id", session.orgId)
      .eq("vendor_id", vendorId),
    supabase.from("submittals").select("id,submittal_state").eq("org_id", session.orgId).eq("vendor_id", vendorId),
  ]);

  const poRows = pos ?? [];
  const subRows = subs ?? [];
  const fulfilled = poRows.filter((p) => p.po_state === "fulfilled").length;
  const cancelled = poRows.filter((p) => p.po_state === "cancelled").length;
  const totalPos = poRows.length;
  const fulfillmentRate = totalPos > 0 ? Math.round((fulfilled / totalPos) * 100) : null;
  const totalCommitted = poRows.reduce((s, r) => s + Number(r.amount_cents), 0);
  const approved = subRows.filter((s) => s.submittal_state === "approved").length;
  const rejected = subRows.filter((s) => s.submittal_state === "rejected").length;
  const submittalRate = subRows.length > 0 ? Math.round((approved / subRows.length) * 100) : null;

  const hasSignal = totalPos > 0 || subRows.length > 0;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.scorecard.eyebrow", undefined, "Vendor")}
        title={t("console.procurement.vendors.scorecard.title", undefined, "Scorecard")}
        subtitle={t(
          "console.procurement.vendors.scorecard.subtitle",
          undefined,
          "Performance across POs + submittals.",
        )}
      />
      <div className="page-content">
        {!hasSignal ? (
          <EmptyState
            title={t("console.procurement.vendors.scorecard.empty.title", undefined, "Not Enough Signal")}
            description={t(
              "console.procurement.vendors.scorecard.empty.description",
              undefined,
              "Scorecard derives from completed POs and reviewed submittals. Issue a PO or accept a submittal to start the trail.",
            )}
          />
        ) : (
          <div className="metric-grid">
            <MetricCard
              label={t("console.procurement.vendors.scorecard.metrics.poFulfillment", undefined, "PO Fulfillment")}
              value={fulfillmentRate != null ? `${fulfillmentRate}%` : "—"}
              accent
            />
            <MetricCard
              label={t("console.procurement.vendors.scorecard.metrics.totalPos", undefined, "Total POs")}
              value={fmt.number(totalPos)}
            />
            <MetricCard
              label={t("console.procurement.vendors.scorecard.metrics.totalCommitted", undefined, "Total Committed")}
              value={formatMoney(totalCommitted)}
            />
            <MetricCard
              label={t("console.procurement.vendors.scorecard.metrics.posCancelled", undefined, "POs Cancelled")}
              value={fmt.number(cancelled)}
            />
            <MetricCard
              label={t(
                "console.procurement.vendors.scorecard.metrics.submittalApproval",
                undefined,
                "Submittal Approval",
              )}
              value={submittalRate != null ? `${submittalRate}%` : "—"}
            />
            <MetricCard
              label={t(
                "console.procurement.vendors.scorecard.metrics.submittalsReviewed",
                undefined,
                "Submittals Reviewed",
              )}
              value={fmt.number(subRows.length)}
            />
            <MetricCard
              label={t(
                "console.procurement.vendors.scorecard.metrics.submittalsRejected",
                undefined,
                "Submittals Rejected",
              )}
              value={fmt.number(rejected)}
            />
          </div>
        )}
      </div>
    </>
  );
}
