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
          eyebrow={t("console.workforce.volunteers.eyebrowFallback", undefined, "Workspace")}
          title={t("console.workforce.volunteers.title", undefined, "Volunteers")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.volunteers.configureSupabase", undefined, "Configure Supabase.")}
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
    filters: [{ column: "kind", op: "eq", value: "volunteer" }],
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.volunteers.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.volunteers.title", undefined, "Volunteers")}
        subtitle={
          total === 1
            ? t("console.workforce.volunteers.subtitleOne", { count: total }, `${total} Record`)
            : t("console.workforce.volunteers.subtitleOther", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/workforce/volunteers/new" size="sm">
            {t("console.workforce.volunteers.addVolunteer", undefined, "+ Add volunteer")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/workforce/volunteers/${r.id}`}
          emptyLabel={t("console.workforce.volunteers.emptyLabel", undefined, "No volunteers")}
          emptyDescription={t(
            "console.workforce.volunteers.emptyDescription",
            undefined,
            "Volunteer roster — onboarding, role assignment, and shift acceptance live on the detail page.",
          )}
          emptyAction={
            <Button href="/studio/workforce/volunteers/new" size="sm">
              {t("console.workforce.volunteers.addVolunteer", undefined, "+ Add volunteer")}
            </Button>
          }
          columns={[
            {
              key: "full_name",
              header: t("console.workforce.volunteers.columns.name", undefined, "Name"),
              render: (r) => String(r.full_name ?? "—"),
              accessor: (r) => r.full_name ?? null,
            },
            {
              key: "role",
              header: t("console.workforce.volunteers.columns.role", undefined, "Role"),
              render: (r) => String(r.role ?? "—"),
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: t("console.workforce.volunteers.columns.email", undefined, "Email"),
              render: (r) => <span className="font-mono text-xs">{String(r.email ?? "—")}</span>,
              accessor: (r) => r.email ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/workforce/volunteers"
          searchParams={sp}
        />
      </div>
    </>
  );
}
