import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function ProcurementHub() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Procurement" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
    .filter((p) => !["fulfilled", "cancelled"].includes(p.status))
    .reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="Procurement Hub" subtitle="Vendors, requisitions, POs" />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard label="Vendors" value={vendors.length} />
          <MetricCard label="Open Requisitions" value={reqs.filter((r) => r.status !== "converted").length} />
          <MetricCard
            label="Open POs"
            value={pos.filter((p) => !["fulfilled", "cancelled"].includes(p.status)).length}
            accent
          />
          <MetricCard label="Open Commitments" value={formatMoney(open)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/console/procurement/vendors", label: "Vendors", sub: "Directory + COIs" },
            { href: "/console/procurement/prequalification", label: "Prequalification", sub: "Vetting workflow" },
            { href: "/console/procurement/sourcing", label: "Sourcing", sub: "Sourcing events" },
            { href: "/console/procurement/scorecards", label: "Scorecards", sub: "Vendor performance" },
            { href: "/console/procurement/requisitions", label: "Requisitions", sub: "Demand capture" },
            { href: "/console/procurement/purchase-orders", label: "Purchase Orders", sub: "Issued POs" },
            { href: "/console/procurement/po-change-orders", label: "PO Change Orders", sub: "Variations + cuts" },
            { href: "/console/procurement/rfqs", label: "RFQs", sub: "Quote requests" },
            { href: "/console/procurement/wo-broadcasts", label: "WO Broadcasts", sub: "Work order sends" },
            { href: "/console/submittals", label: "Submittals", sub: "Drawings + specs" },
            { href: "/console/procurement/catalog", label: "Catalog", sub: "Approved items" },
            { href: "/console/logistics/ratecard", label: "Rate Card", sub: "Standard pricing" },
          ].map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{t.sub}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
