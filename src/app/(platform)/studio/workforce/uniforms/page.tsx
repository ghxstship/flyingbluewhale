import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type UniformRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit_price_cents: number;
  currency: string;
  active: boolean;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.uniforms.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.uniforms.title", undefined, "Uniforms")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.uniforms.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("rate_card_items", session.orgId, {
    orderBy: "name",
    ascending: true,
    pageSize,
    cursor: String(offset),
    filters: [{ column: "catalog", op: "eq", value: "uniform" }],
  });
  const rows = result.rows as UniformRow[];
  const total = result.totalCount;

  const totalSkus = total;
  const activeSkus = rows.filter((r) => r.active).length;
  const skuLabel = t(
    totalSkus === 1 ? "console.workforce.uniforms.skuSingular" : "console.workforce.uniforms.skuPlural",
    undefined,
    totalSkus === 1 ? "SKU" : "SKUs",
  );
  const activeLabel = t("console.workforce.uniforms.activeLabel", undefined, "Active");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.uniforms.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.uniforms.title", undefined, "Uniforms")}
        subtitle={`${totalSkus} ${skuLabel} · ${activeSkus} ${activeLabel}`}
        action={
          <Button href="/studio/logistics/ratecard/new" size="sm">
            {t("console.workforce.uniforms.newSku", undefined, "+ New SKU")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView<UniformRow>
          rows={rows}
          totalCount={total}
          rowHref={(r) => `/studio/logistics/ratecard/${r.id}`}
          emptyLabel={t("console.workforce.uniforms.emptyLabel", undefined, "No uniform SKUs")}
          emptyDescription={t(
            "console.workforce.uniforms.emptyDescription",
            undefined,
            "Uniform inventory is tracked in the rate card with catalog='uniform'. Author each style + size as a SKU with a unit cost.",
          )}
          emptyAction={
            <Button href="/studio/logistics/ratecard/new" size="sm">
              {t("console.workforce.uniforms.newSku", undefined, "+ New SKU")}
            </Button>
          }
          columns={[
            {
              key: "sku",
              header: t("console.workforce.uniforms.columns.sku", undefined, "SKU"),
              render: (r) => r.sku,
              mono: true,
              accessor: (r) => r.sku ?? null,
            },
            {
              key: "name",
              header: t("console.workforce.uniforms.columns.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "description",
              header: t("console.workforce.uniforms.columns.description", undefined, "Description"),
              render: (r) => r.description ?? "—",
              accessor: (r) => r.description ?? null,
            },
            {
              key: "unit_price_cents",
              header: t("console.workforce.uniforms.columns.unitCost", undefined, "Unit Cost"),
              render: (r) => formatMoney(r.unit_price_cents, r.currency),
              mono: true,
              accessor: (r) => r.unit_price_cents ?? null,
            },
            {
              key: "active",
              header: t("console.workforce.uniforms.columns.active", undefined, "Active"),
              render: (r) =>
                r.active ? (
                  <Badge variant="success">{t("console.workforce.uniforms.status.active", undefined, "Active")}</Badge>
                ) : (
                  <Badge variant="muted">{t("console.workforce.uniforms.status.retired", undefined, "Retired")}</Badge>
                ),
              accessor: (r) => r.active ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/workforce/uniforms"
          searchParams={sp}
        />
      </div>
    </>
  );
}
