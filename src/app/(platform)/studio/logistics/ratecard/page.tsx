import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.logistics.ratecard.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.logistics.ratecard.title", undefined, "Rate Card Items")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.logistics.ratecard.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("rate_card_items", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.ratecard.eyebrow", undefined, "Procurement · Source")}
        title={t("console.logistics.ratecard.title", undefined, "Rate Card Items")}
        subtitle={
          total === 1
            ? t("console.logistics.ratecard.subtitleOne", { count: total }, `${total} Item`)
            : t("console.logistics.ratecard.subtitleOther", { count: total }, `${total} Items`)
        }
        action={
          <Button href="/studio/logistics/ratecard/new" size="sm">
            {t("console.logistics.ratecard.newRate", undefined, "+ New Rate")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/logistics/ratecard/${r.id}`}
          emptyLabel={t("console.logistics.ratecard.emptyLabel", undefined, "No rate-card items yet")}
          emptyDescription={t(
            "console.logistics.ratecard.emptyDescription",
            undefined,
            "Author SKUs with unit prices that downstream POs and proposals reference.",
          )}
          emptyAction={
            <Button href="/studio/logistics/ratecard/new" size="sm">
              {t("console.logistics.ratecard.newRate", undefined, "+ New Rate")}
            </Button>
          }
          columns={[
            {
              key: "catalog",
              header: t("console.logistics.ratecard.columns.catalog", undefined, "Catalog"),
              render: (r) => String(r.catalog ?? "—"),
              accessor: (r) => r.catalog ?? null,
            },
            {
              key: "sku",
              header: t("console.logistics.ratecard.columns.sku", undefined, "SKU"),
              render: (r) => String(r.sku ?? "—"),
              mono: true,
              accessor: (r) => r.sku ?? null,
            },
            {
              key: "name",
              header: t("console.logistics.ratecard.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "unit_price_cents",
              header: t("console.logistics.ratecard.columns.unitCents", undefined, "Unit ¢"),
              render: (r) => String(r.unit_price_cents ?? "—"),
              mono: true,
              accessor: (r) => Number(r.unit_price_cents ?? 0),
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/logistics/ratecard"
          searchParams={sp}
        />
      </div>
    </>
  );
}
