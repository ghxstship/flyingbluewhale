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

export const dynamic = "force-dynamic";

type VendorRow = {
  id: string;
  name: string;
  category: string | null;
  w9_on_file: boolean;
  coi_expires_at: string | null;
};

type POAggRow = {
  vendor_id: string;
  amount_cents: number;
  status: string;
};

const COMPLIANCE_DAYS = 30;

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="Supplier Scorecards" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: vendorData }, { data: poData }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name, category, w9_on_file, coi_expires_at")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("purchase_orders")
      .select("vendor_id, amount_cents, status")
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
      if (p.status === "fulfilled") acc.fulfilled += 1;
      if (p.status === "cancelled") acc.cancelled += 1;
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

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Supplier Scorecards"
        subtitle={`${vendors.length} vendor${vendors.length === 1 ? "" : "s"} · ${formatMoney(totalSpend)} lifetime spend · ${w9Pct}% W-9 on file`}
        action={
          <Button href="/console/procurement/vendors" size="sm">
            All vendors
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Vendors" value={vendors.length.toLocaleString()} accent />
          <MetricCard label="W-9 on file" value={`${w9Pct}%`} />
          <MetricCard label="COI expiring · 30d" value={expiringSoon.toLocaleString()} />
        </div>

        {ranked.length === 0 ? (
          <EmptyState
            title="No Vendors Yet"
            description="Author vendors via Procurement → Vendors. Scorecards rank them by PO volume + compliance."
            action={
              <Link href="/console/procurement/vendors" className="btn btn-secondary btn-sm">
                Open vendors
              </Link>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th className="text-end">POs</th>
                  <th className="text-end">Spend</th>
                  <th className="text-end">Fulfilled</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 50).map((v) => {
                  const agg = aggByVendor.get(v.id) ?? { count: 0, total: 0, fulfilled: 0, cancelled: 0 };
                  const fulfilledPct = agg.count > 0 ? Math.round((agg.fulfilled / agg.count) * 100) : null;
                  const expiring =
                    v.coi_expires_at &&
                    new Date(v.coi_expires_at).getTime() - now < COMPLIANCE_DAYS * 24 * 60 * 60 * 1000;
                  return (
                    <tr key={v.id}>
                      <td>
                        <Link
                          href={`/console/procurement/vendors/${v.id}`}
                          className="font-medium hover:text-[var(--org-primary)]"
                        >
                          {v.name}
                        </Link>
                      </td>
                      <td>{v.category ?? "—"}</td>
                      <td className="text-end font-mono text-xs">{agg.count}</td>
                      <td className="text-end font-mono text-xs">{formatMoney(agg.total)}</td>
                      <td className="text-end font-mono text-xs">{fulfilledPct != null ? `${fulfilledPct}%` : "—"}</td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant={v.w9_on_file ? "success" : "warning"}>
                            {v.w9_on_file ? "W-9" : "No W-9"}
                          </Badge>
                          {expiring && <Badge variant="error">COI expiring</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
