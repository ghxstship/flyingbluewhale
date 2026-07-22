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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("dsar_requests", session.orgId, {
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
        eyebrow={t("console.legal.privacy.dsar.eyebrow", undefined, "Legal · Privacy")}
        title={t("console.legal.privacy.dsar.title", undefined, "DSAR Requests")}
        subtitle={
          total === 1
            ? t("console.legal.privacy.dsar.recordCount.one", { count: total }, `${total} Record`)
            : t("console.legal.privacy.dsar.recordCount.other", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/legal/privacy/dsar/new" size="sm">
            {t("console.legal.privacy.dsar.logRequest", undefined, "+ Log request")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
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
              render: (r) => String(r.requester_email ?? "—"),
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
              render: (r) => String(r.due_by ?? "—"),
              mono: true,
              accessor: (r) => r.due_by ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/legal/privacy/dsar"
          searchParams={sp}
        />
      </div>
    </>
  );
}
