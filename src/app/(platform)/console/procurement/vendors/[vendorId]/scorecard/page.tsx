import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  // Compute a scorecard from concrete signals: PO fulfillment, change-order
  // rate, submittal approval rate. No standalone scorecards table — this is
  // derived. Keeps the user honest about source data.
  const [{ data: pos }, { data: subs }] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("id,status,amount_cents")
      .eq("org_id", session.orgId)
      .eq("vendor_id", vendorId),
    supabase.from("submittals").select("id,status").eq("org_id", session.orgId).eq("vendor_id", vendorId),
  ]);

  const poRows = pos ?? [];
  const subRows = subs ?? [];
  const fulfilled = poRows.filter((p) => p.status === "fulfilled").length;
  const cancelled = poRows.filter((p) => p.status === "cancelled").length;
  const totalPos = poRows.length;
  const fulfillmentRate = totalPos > 0 ? Math.round((fulfilled / totalPos) * 100) : null;
  const totalCommitted = poRows.reduce((s, r) => s + Number(r.amount_cents), 0);
  const approved = subRows.filter((s) => s.status === "approved").length;
  const rejected = subRows.filter((s) => s.status === "rejected").length;
  const submittalRate = subRows.length > 0 ? Math.round((approved / subRows.length) * 100) : null;

  const hasSignal = totalPos > 0 || subRows.length > 0;

  return (
    <>
      <ModuleHeader eyebrow="Vendor" title="Scorecard" subtitle="Performance across POs + submittals." />
      <div className="page-content">
        {!hasSignal ? (
          <EmptyState
            title="Not Enough Signal"
            description="Scorecard derives from completed POs and reviewed submittals. Issue a PO or accept a submittal to start the trail."
          />
        ) : (
          <div className="metric-grid">
            <MetricCard label="PO Fulfillment" value={fulfillmentRate != null ? `${fulfillmentRate}%` : "—"} accent />
            <MetricCard label="Total POs" value={fmt.number(totalPos)} />
            <MetricCard label="Total Committed" value={formatMoney(totalCommitted)} />
            <MetricCard label="POs Cancelled" value={fmt.number(cancelled)} />
            <MetricCard label="Submittal Approval" value={submittalRate != null ? `${submittalRate}%` : "—"} />
            <MetricCard label="Submittals Reviewed" value={fmt.number(subRows.length)} />
            <MetricCard label="Submittals Rejected" value={fmt.number(rejected)} />
          </div>
        )}
      </div>
    </>
  );
}
