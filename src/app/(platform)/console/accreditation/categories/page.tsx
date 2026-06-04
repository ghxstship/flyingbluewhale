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
  const rows = await listOrgScoped("accreditation_categories", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.categories.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.categories.title", undefined, "Categories")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.accreditation.categories.recordSingular", undefined, "Record") : t("console.accreditation.categories.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/console/accreditation/categories/new" size="sm">
            {t("console.accreditation.categories.newCategory", undefined, "+ New Category")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/accreditation/categories/${r.id}`}
          emptyLabel={t("console.accreditation.categories.emptyLabel", undefined, "No accreditation categories")}
          emptyDescription={t(
            "console.accreditation.categories.emptyDescription",
            undefined,
            "Categories drive credential design, zone access, and the accreditation matrix.",
          )}
          emptyAction={
            <Button href="/console/accreditation/categories/new" size="sm">
              {t("console.accreditation.categories.newCategory", undefined, "+ New Category")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.accreditation.categories.columns.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{String(r.code ?? "—")}</span>,
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
      </div>
    </>
  );
}
