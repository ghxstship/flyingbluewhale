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
          eyebrow={t("console.participants.delegations.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.participants.delegations.title", undefined, "Delegations")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.participants.delegations.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("delegations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.delegations.eyebrow", undefined, "Participants")}
        title={t("console.participants.delegations.title", undefined, "Delegations")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.participants.delegations.recordSingular", undefined, "Record") : t("console.participants.delegations.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/participants/delegations/new" size="sm">
            {t("console.participants.delegations.newAction", undefined, "+ New Delegation")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/participants/delegations/${r.id}`}
          emptyLabel={t("console.participants.delegations.emptyLabel", undefined, "No delegations")}
          emptyDescription={t(
            "console.participants.delegations.emptyDescription",
            undefined,
            "Country teams, federation rosters, and entourage groupings live here. Each delegation owns its own roster + accreditation matrix.",
          )}
          emptyAction={
            <Button href="/studio/participants/delegations/new" size="sm">
              {t("console.participants.delegations.newAction", undefined, "+ New Delegation")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.participants.delegations.columns.code", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{String(r.code ?? "—")}</span>,
              accessor: (r) => r.code ?? null,
            },
            {
              key: "name",
              header: t("console.participants.delegations.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "country",
              header: t("console.participants.delegations.columns.country", undefined, "Country"),
              render: (r) => String(r.country ?? "—"),
              accessor: (r) => r.country ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
