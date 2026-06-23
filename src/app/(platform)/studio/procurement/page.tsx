import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ProcurementHub() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.procurement.title", undefined, "Procurement")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const [vendors, reqs, pos] = await Promise.all([
    listOrgScoped("vendors", session.orgId),
    listOrgScoped("requisitions", session.orgId),
    listOrgScoped("purchase_orders", session.orgId),
  ]);
  const open = pos
    .filter((p) => !["fulfilled", "cancelled"].includes(p.po_state))
    .reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.hubTitle", undefined, "Procurement Hub")}
        subtitle={t("console.procurement.hubSubtitle", undefined, "Vendors, requisitions, POs")}
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard label={t("console.procurement.metrics.vendors", undefined, "Vendors")} value={vendors.length} />
          <MetricCard
            label={t("console.procurement.metrics.openRequisitions", undefined, "Open Requisitions")}
            value={reqs.filter((r) => r.requisition_state !== "converted").length}
          />
          <MetricCard
            label={t("console.procurement.metrics.openPOs", undefined, "Open POs")}
            value={pos.filter((p) => !["fulfilled", "cancelled"].includes(p.po_state)).length}
            accent
          />
          <MetricCard
            label={t("console.procurement.metrics.openCommitments", undefined, "Open Commitments")}
            value={formatMoney(open)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/studio/procurement/vendors",
              label: t("console.procurement.tiles.vendors.label", undefined, "Vendors"),
              sub: t("console.procurement.tiles.vendors.sub", undefined, "Directory + COIs"),
            },
            {
              href: "/studio/procurement/prequalification",
              label: t("console.procurement.tiles.prequalification.label", undefined, "Prequalification"),
              sub: t("console.procurement.tiles.prequalification.sub", undefined, "Vetting workflow"),
            },
            {
              href: "/studio/procurement/sourcing",
              label: t("console.procurement.tiles.sourcing.label", undefined, "Sourcing"),
              sub: t("console.procurement.tiles.sourcing.sub", undefined, "Sourcing events"),
            },
            {
              href: "/studio/procurement/scorecards",
              label: t("console.procurement.tiles.scorecards.label", undefined, "Scorecards"),
              sub: t("console.procurement.tiles.scorecards.sub", undefined, "Vendor performance"),
            },
            {
              href: "/studio/procurement/requisitions",
              label: t("console.procurement.tiles.requisitions.label", undefined, "Requisitions"),
              sub: t("console.procurement.tiles.requisitions.sub", undefined, "Demand capture"),
            },
            {
              href: "/studio/procurement/purchase-orders",
              label: t("console.procurement.tiles.purchaseOrders.label", undefined, "Purchase Orders"),
              sub: t("console.procurement.tiles.purchaseOrders.sub", undefined, "Issued POs"),
            },
            {
              href: "/studio/procurement/po-change-orders",
              label: t("console.procurement.tiles.poChangeOrders.label", undefined, "PO Change Orders"),
              sub: t("console.procurement.tiles.poChangeOrders.sub", undefined, "Variations + cuts"),
            },
            {
              href: "/studio/procurement/rfqs",
              label: t("console.procurement.tiles.rfqs.label", undefined, "RFQs"),
              sub: t("console.procurement.tiles.rfqs.sub", undefined, "Quote requests"),
            },
            {
              href: "/studio/procurement/wo-broadcasts",
              label: t("console.procurement.tiles.woBroadcasts.label", undefined, "WO Broadcasts"),
              sub: t("console.procurement.tiles.woBroadcasts.sub", undefined, "Work order sends"),
            },
            {
              href: "/studio/submittals",
              label: t("console.procurement.tiles.submittals.label", undefined, "Submittals"),
              sub: t("console.procurement.tiles.submittals.sub", undefined, "Drawings + specs"),
            },
            {
              href: "/studio/procurement/catalog",
              label: t("console.procurement.tiles.catalog.label", undefined, "Catalog"),
              sub: t("console.procurement.tiles.catalog.sub", undefined, "Approved items"),
            },
            {
              href: "/studio/logistics/ratecard",
              label: t("console.procurement.tiles.rateCard.label", undefined, "Rate Card"),
              sub: t("console.procurement.tiles.rateCard.sub", undefined, "Standard pricing"),
            },
          ].map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.sub}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
