import { ModuleHeader } from "@/components/Shell";
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
  const rows = await listOrgScoped("accreditations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "state", op: "eq", value: "vetting" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.vetting.eyebrow", undefined, "Workspace")}
        title={t("console.accreditation.vetting.title", undefined, "Vetting Queue")}
        subtitle={
          rows.length === 1
            ? t("console.accreditation.vetting.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.accreditation.vetting.subtitleOther", { count: rows.length }, `${rows.length} Records`)
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/accreditation/vetting/${r.id}`}
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
      </div>
    </>
  );
}
