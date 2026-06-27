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
          eyebrow={t("console.workforce.contractors.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.workforce.contractors.title", undefined, "Contractors")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.contractors.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("workforce_members", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
    filters: [{ column: "kind", op: "eq", value: "contractor" }],
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.contractors.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.contractors.title", undefined, "Contractors")}
        subtitle={
          total === 1
            ? t("console.workforce.contractors.subtitleOne", { count: total }, `${total} Record`)
            : t("console.workforce.contractors.subtitleOther", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/workforce/contractors/new" size="sm">
            {t("console.workforce.contractors.addAction", undefined, "+ Add contractor")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/workforce/contractors/${r.id}`}
          emptyLabel={t("console.workforce.contractors.emptyLabel", undefined, "No contractors")}
          emptyDescription={t(
            "console.workforce.contractors.emptyDescription",
            undefined,
            "Independent contractors and freelancers — capture W-9/insurance and SOW deliverables.",
          )}
          emptyAction={
            <Button href="/studio/workforce/contractors/new" size="sm">
              {t("console.workforce.contractors.addAction", undefined, "+ Add contractor")}
            </Button>
          }
          columns={[
            {
              key: "full_name",
              header: t("console.workforce.contractors.columnName", undefined, "Name"),
              render: (r) => String(r.full_name ?? "—"),
              accessor: (r) => r.full_name ?? null,
            },
            {
              key: "role",
              header: t("console.workforce.contractors.columnRole", undefined, "Role"),
              render: (r) => String(r.role ?? "—"),
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: t("console.workforce.contractors.columnEmail", undefined, "Email"),
              render: (r) => <span className="font-mono text-xs">{String(r.email ?? "—")}</span>,
              accessor: (r) => r.email ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/workforce/contractors"
          searchParams={sp}
        />
      </div>
    </>
  );
}
