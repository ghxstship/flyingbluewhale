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
          eyebrow={t("console.accreditation.categories.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.accreditation.categories.title", undefined, "Categories")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.categories.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("accreditation_categories", session.orgId, {
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
        eyebrow={t("console.accreditation.categories.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.categories.title", undefined, "Categories")}
        subtitle={`${total} ${total === 1 ? t("console.accreditation.categories.recordSingular", undefined, "Record") : t("console.accreditation.categories.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/accreditation/categories/new" size="sm">
            {t("console.accreditation.categories.newCategory", undefined, "+ New Category")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/accreditation/categories/${r.id}`}
          emptyLabel={t("console.accreditation.categories.emptyLabel", undefined, "No accreditation categories")}
          emptyDescription={t(
            "console.accreditation.categories.emptyDescription",
            undefined,
            "Categories drive credential design, zone access, and the accreditation matrix.",
          )}
          emptyAction={
            <Button href="/studio/accreditation/categories/new" size="sm">
              {t("console.accreditation.categories.newCategory", undefined, "+ New Category")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.accreditation.categories.columns.code", undefined, "Code"),
              render: (r) => String(r.code ?? "—"),
              mono: true,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "name",
              header: t("console.accreditation.categories.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "description",
              header: t("console.accreditation.categories.columns.description", undefined, "Description"),
              render: (r) => String(r.description ?? "—"),
              accessor: (r) => r.description ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/accreditation/categories"
          searchParams={sp}
        />
      </div>
    </>
  );
}
