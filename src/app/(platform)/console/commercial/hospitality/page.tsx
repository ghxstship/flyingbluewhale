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
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type CatalogRow = {
  id: string;
  name: string;
  code: string;
  unit_cost_cents: number | null;
  currency: string | null;
  inventory_qty: number | null;
  open_count: number;
  fulfilled_count: number;
  total_count: number;
};

type EntitlementRow = {
  id: string;
  title: string;
  quantity: number;
  delivered: number;
  status: string;
  due_by: string | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  contracted: "muted",
  in_progress: "info",
  delivered: "success",
  blocked: "warning",
};

const HOSP_CODE_PREFIX = "hospitality";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Commercial" title="Hospitality" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Hospitality packages are now master_catalog_items rows of kind='ticket'
  // tagged via the `code` prefix (or a description marker). The
  // v_catalog_inventory view rolls up live counts from the assignments
  // table — no denormalized `sold` to maintain.
  const [{ data: ttData }, { data: entData }] = await Promise.all([
    supabase
      .from("v_catalog_inventory")
      .select("catalog_item_id, name, code, allocated, open_count, fulfilled_count, total_count")
      .eq("org_id", session.orgId)
      .eq("catalog_kind", "ticket")
      .ilike("code", `${HOSP_CODE_PREFIX}%`)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("sponsor_entitlements")
      .select("id, title, quantity, delivered, status, due_by")
      .eq("org_id", session.orgId)
      .ilike("title", "%hospitality%")
      .order("due_by", { ascending: true })
      .limit(200),
  ]);

  // We also need unit_cost_cents + currency for revenue rollup.
  const ids = ((ttData ?? []) as Array<{ catalog_item_id: string }>).map((r) => r.catalog_item_id);
  const { data: pricing } = ids.length
    ? await supabase.from("master_catalog_items").select("id, unit_cost_cents, currency").in("id", ids)
    : { data: [] };
  const priceMap = new Map<string, { unit_cost_cents: number | null; currency: string | null }>(
    ((pricing ?? []) as Array<{ id: string; unit_cost_cents: number | null; currency: string | null }>).map((p) => [
      p.id,
      { unit_cost_cents: p.unit_cost_cents, currency: p.currency },
    ]),
  );

  type InvRow = {
    catalog_item_id: string;
    name: string;
    code: string;
    allocated: number | null;
    open_count: number;
    fulfilled_count: number;
    total_count: number;
  };
  const packages: CatalogRow[] = ((ttData ?? []) as unknown as InvRow[]).map((r) => ({
    id: r.catalog_item_id,
    name: r.name,
    code: r.code,
    unit_cost_cents: priceMap.get(r.catalog_item_id)?.unit_cost_cents ?? null,
    currency: priceMap.get(r.catalog_item_id)?.currency ?? null,
    inventory_qty: r.allocated,
    open_count: r.open_count,
    fulfilled_count: r.fulfilled_count,
    total_count: r.total_count,
  }));
  const ents = (entData ?? []) as EntitlementRow[];

  const totalAllocation = packages.reduce((s, p) => s + (p.inventory_qty ?? 0), 0);
  const totalRevenue = packages.reduce((s, p) => s + (p.inventory_qty ?? 0) * (p.unit_cost_cents ?? 0), 0);
  const totalEntitlements = ents.reduce((s, e) => s + e.quantity, 0);
  const delivered = ents.reduce((s, e) => s + e.delivered, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Commercial"
        title="Hospitality"
        subtitle={`${packages.length} package${packages.length === 1 ? "" : "s"} · ${fmt.number(totalAllocation)} seats · ${ents.length} entitlement${ents.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/commercial/sponsors" size="sm">
            Sponsors
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Allocation" value={fmt.number(totalAllocation)} accent />
          <MetricCard label="Revenue at Allocation" value={formatMoney(totalRevenue)} />
          <MetricCard
            label="Entitlements Delivered"
            value={`${fmt.number(delivered)} / ${fmt.number(totalEntitlements)}`}
          />
        </div>

        <section>
          <h3 className="text-sm font-semibold">Hospitality Packages</h3>
          {packages.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Hospitality Packages"
              description="Hospitality maps onto master_catalog_items rows of kind='ticket' whose code starts with 'hospitality'. Author one in Console → Catalog."
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {packages.map((t) => (
                <li key={t.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {fmt.number(t.inventory_qty ?? 0)} seats ·{" "}
                      {formatMoney(t.unit_cost_cents ?? 0, t.currency ?? "USD")} ea · {fmt.number(t.fulfilled_count)}{" "}
                      redeemed / {fmt.number(t.total_count)} issued
                    </div>
                  </div>
                  <Badge variant="muted">{t.code}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">Sponsor Hospitality Entitlements</h3>
          {ents.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Hospitality Entitlements"
              description="Author sponsor entitlements with 'hospitality' in the title via the Commercial → Sponsors module."
              action={
                <Link href="/console/commercial/sponsors" className="btn btn-secondary btn-sm">
                  Open sponsors
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {ents.map((e) => (
                <li key={e.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {e.delivered} / {e.quantity} delivered
                      {e.due_by ? ` · due ${e.due_by}` : ""}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[e.status] ?? "muted"}>{toTitle(e.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
