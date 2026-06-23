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
          eyebrow={t("console.legal.privacy.dsar.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.legal.privacy.dsar.titleLower", undefined, "DSAR requests")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.legal.privacy.dsar.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("dsar_requests", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.privacy.dsar.eyebrow", undefined, "Legal · Privacy")}
        title={t("console.legal.privacy.dsar.title", undefined, "DSAR Requests")}
        subtitle={
          rows.length === 1
            ? t("console.legal.privacy.dsar.recordCount.one", { count: rows.length }, `${rows.length} Record`)
            : t("console.legal.privacy.dsar.recordCount.other", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/legal/privacy/dsar/new" size="sm">
            {t("console.legal.privacy.dsar.logRequest", undefined, "+ Log request")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/legal/privacy/dsar/${r.id}`}
          emptyLabel={t("console.legal.privacy.dsar.emptyLabel", undefined, "No DSAR requests")}
          emptyDescription={t(
            "console.legal.privacy.dsar.emptyDescription",
            undefined,
            "Subject access, deletion, and portability requests with statutory due dates.",
          )}
          emptyAction={
            <Button href="/studio/legal/privacy/dsar/new" size="sm">
              {t("console.legal.privacy.dsar.logRequest", undefined, "+ Log request")}
            </Button>
          }
          columns={[
            {
              key: "requester_email",
              header: t("console.legal.privacy.dsar.col.requester", undefined, "Requester"),
              render: (r) => <span className="font-mono text-xs">{String(r.requester_email ?? "—")}</span>,
              accessor: (r) => r.requester_email ?? null,
            },
            {
              key: "kind",
              header: t("console.legal.privacy.dsar.col.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "status",
              header: t("console.legal.privacy.dsar.col.status", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "due_by",
              header: t("console.legal.privacy.dsar.col.due", undefined, "Due"),
              render: (r) => <span className="font-mono text-xs">{String(r.due_by ?? "—")}</span>,
              accessor: (r) => r.due_by ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
