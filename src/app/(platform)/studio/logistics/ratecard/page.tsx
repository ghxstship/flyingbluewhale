import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
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
  const rows = await listOrgScoped("rate_card_items", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.ratecard.eyebrow", undefined, "Logistics")}
        title={t("console.logistics.ratecard.title", undefined, "Rate Card Items")}
        subtitle={
          rows.length === 1
            ? t("console.logistics.ratecard.subtitleOne", { count: rows.length }, `${rows.length} Item`)
            : t("console.logistics.ratecard.subtitleOther", { count: rows.length }, `${rows.length} Items`)
        }
        action={
          <Button href="/studio/logistics/ratecard/new" size="sm">
            {t("console.logistics.ratecard.newRate", undefined, "+ New Rate")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
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
              render: (r) => <span className="font-mono text-xs">{String(r.sku ?? "—")}</span>,
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
              render: (r) => <span className="font-mono text-xs">{String(r.unit_price_cents ?? "—")}</span>,
              accessor: (r) => Number(r.unit_price_cents ?? 0),
            },
          ]}
        />
      </div>
    </>
  );
}
