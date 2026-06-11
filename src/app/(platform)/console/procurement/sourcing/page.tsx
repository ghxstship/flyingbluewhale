import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type RequisitionRow = {
  id: string;
  title: string;
  estimated_cents: number | null;
  requisition_state: string;
  created_at: string;
};

type PORow = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  requisition_state: string;
  vendor: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.sourcing.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.sourcing.title", undefined, "Sourcing")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.sourcing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: reqData }, { data: poData }] = await Promise.all([
    supabase
      .from("requisitions")
      .select("id, title, estimated_cents, requisition_state, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("purchase_orders")
      .select("id, number, title, amount_cents, po_state, vendor:vendor_id(name)")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const reqs = (reqData ?? []) as RequisitionRow[];
  const pos = (poData ?? []) as unknown as PORow[];
  const open = reqs.filter((r) => !["converted", "rejected"].includes(r.requisition_state)).length;
  const converted = reqs.filter((r) => r.requisition_state === "converted").length;
  const conversionRate = reqs.length > 0 ? Math.round((converted / reqs.length) * 100) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.sourcing.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.sourcing.title", undefined, "Sourcing")}
        subtitle={`${reqs.length} ${reqs.length === 1 ? t("console.procurement.sourcing.requisitionSingular", undefined, "Requisition") : t("console.procurement.sourcing.requisitionPlural", undefined, "Requisitions")} · ${pos.length} ${pos.length === 1 ? t("console.procurement.sourcing.activePoSingular", undefined, "Active PO") : t("console.procurement.sourcing.activePoPlural", undefined, "Active POs")}${conversionRate != null ? ` · ${t("console.procurement.sourcing.percentConverted", { pct: conversionRate }, `${conversionRate}% converted`)}` : ""}`}
        action={
          <Button href="/console/procurement/requisitions/new" size="sm">
            {t("console.procurement.sourcing.newRequisition", undefined, "+ New Requisition")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.sourcing.metric.openRequisitions", undefined, "Open Requisitions")}
            value={fmt.number(open)}
            accent
          />
          <MetricCard
            label={t("console.procurement.sourcing.metric.activePOs", undefined, "Active POs")}
            value={fmt.number(pos.length)}
          />
          <MetricCard
            label={t("console.procurement.sourcing.metric.converted", undefined, "Converted")}
            value={fmt.number(converted)}
          />
        </div>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.procurement.sourcing.requisitionPipeline", undefined, "Requisition Pipeline")}
          </h3>
          {reqs.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.procurement.sourcing.empty.noRequisitions.title", undefined, "No Requisitions")}
              description={t(
                "console.procurement.sourcing.empty.noRequisitions.description",
                undefined,
                "Sourcing pulls from open requisitions. Author one to start the funnel.",
              )}
              action={
                <Link href="/console/procurement/requisitions/new" className="ps-btn ps-btn--ghost ps-btn--sm">
                  {t("console.procurement.sourcing.newRequisition", undefined, "+ New Requisition")}
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {reqs.slice(0, 10).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/console/procurement/requisitions/${r.id}`}
                    className="surface flex items-center justify-between p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="font-mono text-xs text-[var(--p-text-2)]">
                        {formatMoney(r.estimated_cents ?? 0)}
                      </div>
                    </div>
                    <Badge variant={toneFor(r.requisition_state)}>{toTitle(r.requisition_state)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.procurement.sourcing.recentPurchaseOrders", undefined, "Recent Purchase Orders")}
          </h3>
          {pos.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.procurement.sourcing.empty.noPOs.title", undefined, "No POs Issued Yet")}
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {pos.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/console/procurement/purchase-orders/${p.id}`}
                    className="surface flex items-center justify-between p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        <span className="font-mono text-xs">{p.number}</span> · {p.title}
                      </div>
                      <div className="text-xs text-[var(--p-text-2)]">
                        {p.vendor?.name ?? t("console.procurement.sourcing.noVendor", undefined, "No vendor")} ·{" "}
                        {formatMoney(p.amount_cents)}
                      </div>
                    </div>
                    <Badge variant={toneFor(p.requisition_state)}>{toTitle(p.requisition_state)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
