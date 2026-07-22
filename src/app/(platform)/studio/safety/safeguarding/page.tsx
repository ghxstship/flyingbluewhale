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
          eyebrow={t("console.safety.safeguarding.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.safety.safeguarding.title", undefined, "Safeguarding Reports")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.safeguarding.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("safeguarding_reports", session.orgId, {
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
        eyebrow={t("console.safety.safeguarding.eyebrow", undefined, "Safety")}
        title={t("console.safety.safeguarding.title", undefined, "Safeguarding Reports")}
        subtitle={`${total} ${total === 1 ? t("console.safety.safeguarding.recordSingular", undefined, "Record") : t("console.safety.safeguarding.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/safety/safeguarding/new" size="sm">
            {t("console.safety.safeguarding.fileReport", undefined, "+ File report")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/safety/safeguarding/${r.id}`}
          emptyLabel={t("console.safety.safeguarding.emptyLabel", undefined, "No safeguarding reports")}
          emptyDescription={t(
            "console.safety.safeguarding.emptyDescription",
            undefined,
            "Sensitive disclosures route here for triage by the designated safeguarding lead.",
          )}
          emptyAction={
            <Button href="/studio/safety/safeguarding/new" size="sm">
              {t("console.safety.safeguarding.fileReport", undefined, "+ File report")}
            </Button>
          }
          columns={[
            {
              key: "status",
              header: t("console.safety.safeguarding.columnStatus", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "created_at",
              header: t("console.safety.safeguarding.columnFiled", undefined, "Filed"),
              render: (r) => String(r.created_at ?? "—"),
              mono: true,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/safety/safeguarding"
          searchParams={sp}
        />
      </div>
    </>
  );
}
