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
  const rows = await listOrgScoped("workforce_members", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "contractor" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.contractors.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.contractors.title", undefined, "Contractors")}
        subtitle={
          rows.length === 1
            ? t("console.workforce.contractors.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.workforce.contractors.subtitleOther", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/console/workforce/contractors/new" size="sm">
            {t("console.workforce.contractors.addAction", undefined, "+ Add contractor")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/workforce/contractors/${r.id}`}
          emptyLabel={t("console.workforce.contractors.emptyLabel", undefined, "No contractors")}
          emptyDescription={t(
            "console.workforce.contractors.emptyDescription",
            undefined,
            "Independent contractors and freelancers — capture W-9/insurance and SOW deliverables.",
          )}
          emptyAction={
            <Button href="/console/workforce/contractors/new" size="sm">
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
      </div>
    </>
  );
}
