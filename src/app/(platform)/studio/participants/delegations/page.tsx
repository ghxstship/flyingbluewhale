import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("delegations", session.orgId, {
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
        eyebrow={t("console.participants.delegations.eyebrow", undefined, "Participants")}
        title={t("console.participants.delegations.title", undefined, "Delegations")}
        subtitle={`${total} ${total === 1 ? t("console.participants.delegations.recordSingular", undefined, "Record") : t("console.participants.delegations.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/participants/delegations/new" size="sm">
            {t("console.participants.delegations.newAction", undefined, "+ New Delegation")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
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
              render: (r) => String(r.code ?? "—"),
              accessor: (r) => r.code ?? null,
              mono: true,
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
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/participants/delegations"
          searchParams={sp}
        />
      </div>
    </>
  );
}
