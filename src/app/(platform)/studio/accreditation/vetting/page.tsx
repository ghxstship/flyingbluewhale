import { ModuleHeader } from "@/components/Shell";
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
          eyebrow={t("console.accreditation.vetting.eyebrow", undefined, "Workspace")}
          title={t("console.accreditation.vetting.title", undefined, "Vetting Queue")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.vetting.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("accreditations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
    filters: [{ column: "state", op: "eq", value: "vetting" }],
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.vetting.eyebrow", undefined, "Workspace")}
        title={t("console.accreditation.vetting.title", undefined, "Vetting Queue")}
        subtitle={
          total === 1
            ? t("console.accreditation.vetting.subtitleOne", { count: total }, `${total} Record`)
            : t("console.accreditation.vetting.subtitleOther", { count: total }, `${total} Records`)
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/accreditation/vetting/${r.id}`}
          emptyLabel={t("console.accreditation.vetting.emptyLabel", undefined, "No applications in vetting")}
          emptyDescription={t(
            "console.accreditation.vetting.emptyDescription",
            undefined,
            "Applications land here once a delegate submits identity + role information for review.",
          )}
          columns={[
            {
              key: "person_name",
              header: t("console.accreditation.vetting.columns.person", undefined, "Person"),
              render: (r) => String(r.person_name ?? "—"),
              accessor: (r) => r.person_name ?? null,
            },
            {
              key: "person_email",
              header: t("console.accreditation.vetting.columns.email", undefined, "Email"),
              render: (r) => <span className="font-mono text-xs">{String(r.person_email ?? "—")}</span>,
              accessor: (r) => r.person_email ?? null,
            },
            {
              key: "vetting",
              header: t("console.accreditation.vetting.columns.status", undefined, "Status"),
              render: (r) => String(r.vetting ?? "—"),
              accessor: (r) => r.vetting ?? null,
            },
            {
              key: "created_at",
              header: t("console.accreditation.vetting.columns.submitted", undefined, "Submitted"),
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/accreditation/vetting"
          searchParams={sp}
        />
      </div>
    </>
  );
}
