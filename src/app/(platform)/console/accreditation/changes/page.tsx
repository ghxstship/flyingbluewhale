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
          eyebrow={t("console.accreditation.changes.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.accreditation.changes.titleFallback", undefined, "Accreditation Changes")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.changes.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("accreditation_changes", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.changes.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.changes.title", undefined, "Changes")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.accreditation.changes.recordSingular", undefined, "Record") : t("console.accreditation.changes.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/console/accreditation/changes/new" size="sm">
            {t("console.accreditation.changes.requestChange", undefined, "+ Request change")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/accreditation/changes/${r.id}`}
          emptyLabel={t("console.accreditation.changes.emptyLabel", undefined, "No accreditation changes")}
          emptyDescription={t(
            "console.accreditation.changes.emptyDescription",
            undefined,
            "Re-issue, role change, and revocation requests with audit trail.",
          )}
          emptyAction={
            <Button href="/console/accreditation/changes/new" size="sm">
              {t("console.accreditation.changes.requestChange", undefined, "+ Request change")}
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: t("console.accreditation.changes.columnKind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: t("console.accreditation.changes.columnStatus", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "created_at",
              header: t("console.accreditation.changes.columnRequested", undefined, "Requested"),
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
