import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
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
          eyebrow={t("console.commercial.sponsors.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.commercial.sponsors.title", undefined, "Sponsor Entitlements")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.commercial.sponsors.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("sponsor_entitlements", session.orgId, {
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
        eyebrow={t("console.commercial.sponsors.eyebrow", undefined, "Commercial")}
        title={t("console.commercial.sponsors.title", undefined, "Sponsor Entitlements")}
        subtitle={
          total === 1
            ? t("console.commercial.sponsors.subtitleOne", { count: total }, `${total} Record`)
            : t("console.commercial.sponsors.subtitleOther", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/commercial/sponsors/new" size="sm">
            {t("console.commercial.sponsors.newSponsor", undefined, "+ New Sponsor")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/commercial/sponsors/${r.id}`}
          emptyLabel={t("console.commercial.sponsors.emptyLabel", undefined, "No sponsor entitlements")}
          emptyDescription={t(
            "console.commercial.sponsors.emptyDescription",
            undefined,
            "Track contracted deliverables — signage, hospitality counts, on-air mentions — and status against fulfilment.",
          )}
          emptyAction={
            <Button href="/studio/commercial/sponsors/new" size="sm">
              {t("console.commercial.sponsors.newSponsor", undefined, "+ New Sponsor")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.commercial.sponsors.columns.title", undefined, "Title"),
              render: (r) => String(r.title ?? "—"),
              accessor: (r) => r.title ?? null,
            },
            {
              key: "quantity",
              header: t("console.commercial.sponsors.columns.quantity", undefined, "Quantity"),
              render: (r) => <span className="font-mono text-xs">{String(r.quantity ?? "—")}</span>,
              accessor: (r) => r.quantity ?? null,
            },
            {
              key: "delivered",
              header: t("console.commercial.sponsors.columns.delivered", undefined, "Delivered"),
              render: (r) => <span className="font-mono text-xs">{String(r.delivered ?? "—")}</span>,
              accessor: (r) => r.delivered ?? null,
            },
            {
              key: "status",
              header: t("console.commercial.sponsors.columns.status", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "due_by",
              header: t("console.commercial.sponsors.columns.dueBy", undefined, "Due By"),
              render: (r) => <span className="font-mono text-xs">{String(r.due_by ?? "—")}</span>,
              accessor: (r) => r.due_by ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/commercial/sponsors"
          searchParams={sp}
        />
      </div>
    </>
  );
}
