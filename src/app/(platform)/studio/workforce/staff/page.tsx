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
          eyebrow={t("console.workforce.staff.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.workforce.staff.title", undefined, "Paid Staff")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.staff.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("workforce_members", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "paid_staff" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.staff.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.staff.title", undefined, "Paid Staff")}
        subtitle={
          rows.length === 1
            ? t("console.workforce.staff.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.workforce.staff.subtitleMany", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/workforce/staff/new" size="sm">
            {t("console.workforce.staff.addStaff", undefined, "+ Add staff")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/workforce/staff/${r.id}`}
          emptyLabel={t("console.workforce.staff.emptyLabel", undefined, "No paid staff")}
          emptyDescription={t(
            "console.workforce.staff.emptyDescription",
            undefined,
            "Salaried + hourly employees with employment-record retention obligations.",
          )}
          emptyAction={
            <Button href="/studio/workforce/staff/new" size="sm">
              {t("console.workforce.staff.addStaff", undefined, "+ Add staff")}
            </Button>
          }
          columns={[
            {
              key: "full_name",
              header: t("console.workforce.staff.columnName", undefined, "Name"),
              render: (r) => String(r.full_name ?? "—"),
              accessor: (r) => r.full_name ?? null,
            },
            {
              key: "role",
              header: t("console.workforce.staff.columnRole", undefined, "Role"),
              render: (r) => String(r.role ?? "—"),
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: t("console.workforce.staff.columnEmail", undefined, "Email"),
              render: (r) => <span className="font-mono text-xs">{String(r.email ?? "—")}</span>,
              accessor: (r) => r.email ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
