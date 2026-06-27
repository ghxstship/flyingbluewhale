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
          eyebrow={t("console.participants.visa.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.participants.visa.title", undefined, "Visa Cases")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.participants.visa.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("visa_cases", session.orgId, {
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
        eyebrow={t("console.participants.visa.eyebrow", undefined, "Participants")}
        title={t("console.participants.visa.title", undefined, "Visa Cases")}
        subtitle={
          total === 1
            ? t("console.participants.visa.recordCountOne", { count: total }, `${total} Record`)
            : t("console.participants.visa.recordCountOther", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/participants/visa/new" size="sm">
            {t("console.participants.visa.newCase", undefined, "+ New Case")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/participants/visa/${r.id}`}
          emptyLabel={t("console.participants.visa.emptyLabel", undefined, "No visa cases")}
          emptyDescription={t(
            "console.participants.visa.emptyDescription",
            undefined,
            "Track invitation letters, ROC submissions, and arrival/exit clearance through the visa workflow.",
          )}
          emptyAction={
            <Button href="/studio/participants/visa/new" size="sm">
              {t("console.participants.visa.newCase", undefined, "+ New Case")}
            </Button>
          }
          columns={[
            {
              key: "person_name",
              header: t("console.participants.visa.columnName", undefined, "Name"),
              render: (r) => String(r.person_name ?? "—"),
              accessor: (r) => r.person_name ?? null,
            },
            {
              key: "nationality",
              header: t("console.participants.visa.columnNationality", undefined, "Nationality"),
              render: (r) => String(r.nationality ?? "—"),
              accessor: (r) => r.nationality ?? null,
            },
            {
              key: "status",
              header: t("console.participants.visa.columnStatus", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/participants/visa"
          searchParams={sp}
        />
      </div>
    </>
  );
}
