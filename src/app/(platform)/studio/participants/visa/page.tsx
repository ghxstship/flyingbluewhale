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
  const rows = await listOrgScoped("visa_cases", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.visa.eyebrow", undefined, "Participants")}
        title={t("console.participants.visa.title", undefined, "Visa Cases")}
        subtitle={
          rows.length === 1
            ? t("console.participants.visa.recordCountOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.participants.visa.recordCountOther", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/participants/visa/new" size="sm">
            {t("console.participants.visa.newCase", undefined, "+ New Case")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
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
      </div>
    </>
  );
}
