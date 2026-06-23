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
  entitlement_state: string;
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.commercial.hospitality.eyebrow", undefined, "Commercial")}
          title={t("console.commercial.hospitality.title", undefined, "Hospitality")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.commercial.hospitality.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
      .select("id, title, quantity, delivered, entitlement_state, due_by")
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
        eyebrow={t("console.commercial.hospitality.eyebrow", undefined, "Commercial")}
        title={t("console.commercial.hospitality.title", undefined, "Hospitality")}
        subtitle={`${packages.length} ${packages.length === 1 ? t("console.commercial.hospitality.packageOne", undefined, "package") : t("console.commercial.hospitality.packageMany", undefined, "packages")} · ${fmt.number(totalAllocation)} ${t("console.commercial.hospitality.seats", undefined, "seats")} · ${ents.length} ${ents.length === 1 ? t("console.commercial.hospitality.entitlementOne", undefined, "entitlement") : t("console.commercial.hospitality.entitlementMany", undefined, "entitlements")}`}
        action={
          <Button href="/studio/commercial/sponsors" size="sm">
            {t("console.commercial.hospitality.sponsorsAction", undefined, "Sponsors")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.commercial.hospitality.allocation", undefined, "Allocation")}
            value={fmt.number(totalAllocation)}
            accent
          />
          <MetricCard
            label={t("console.commercial.hospitality.revenueAtAllocation", undefined, "Revenue at Allocation")}
            value={formatMoney(totalRevenue)}
          />
          <MetricCard
            label={t("console.commercial.hospitality.entitlementsDelivered", undefined, "Entitlements Delivered")}
            value={`${fmt.number(delivered)} / ${fmt.number(totalEntitlements)}`}
          />
        </div>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.commercial.hospitality.packagesHeading", undefined, "Hospitality Packages")}
          </h3>
          {packages.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.commercial.hospitality.noPackagesTitle", undefined, "No Hospitality Packages")}
              description={t(
                "console.commercial.hospitality.noPackagesDescription",
                undefined,
                "Hospitality maps onto master_catalog_items rows of kind='ticket' whose code starts with 'hospitality'. Author one in Console → Catalog.",
              )}
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {packages.map((pkg) => (
                <li key={pkg.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{pkg.name}</div>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">
                      {fmt.number(pkg.inventory_qty ?? 0)}{" "}
                      {t("console.commercial.hospitality.seats", undefined, "seats")} ·{" "}
                      {formatMoney(pkg.unit_cost_cents ?? 0, pkg.currency ?? "USD")}{" "}
                      {t("console.commercial.hospitality.each", undefined, "ea")} · {fmt.number(pkg.fulfilled_count)}{" "}
                      {t("console.commercial.hospitality.redeemed", undefined, "redeemed")} /{" "}
                      {fmt.number(pkg.total_count)} {t("console.commercial.hospitality.issued", undefined, "issued")}
                    </div>
                  </div>
                  <Badge variant="muted">{pkg.code}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.commercial.hospitality.entitlementsHeading", undefined, "Sponsor Hospitality Entitlements")}
          </h3>
          {ents.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.commercial.hospitality.noEntitlementsTitle", undefined, "No Hospitality Entitlements")}
              description={t(
                "console.commercial.hospitality.noEntitlementsDescription",
                undefined,
                "Author sponsor entitlements with 'hospitality' in the title via the Commercial → Sponsors module.",
              )}
              action={
                <Link href="/studio/commercial/sponsors" className="ps-btn ps-btn--ghost ps-btn--sm">
                  {t("console.commercial.hospitality.openSponsors", undefined, "Open sponsors")}
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {ents.map((e) => (
                <li key={e.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">
                      {e.delivered} / {e.quantity}{" "}
                      {t("console.commercial.hospitality.delivered", undefined, "delivered")}
                      {e.due_by ? ` · ${t("console.commercial.hospitality.due", undefined, "due")} ${e.due_by}` : ""}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[e.entitlement_state] ?? "muted"}>{toTitle(e.entitlement_state)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
