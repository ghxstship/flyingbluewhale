import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("accreditation_changes", session.orgId, {
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
        eyebrow={t("console.accreditation.changes.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.changes.title", undefined, "Changes")}
        subtitle={`${total} ${total === 1 ? t("console.accreditation.changes.recordSingular", undefined, "Record") : t("console.accreditation.changes.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/accreditation/changes/new" size="sm">
            {t("console.accreditation.changes.requestChange", undefined, "+ Request change")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/accreditation/changes/${r.id}`}
          emptyLabel={t("console.accreditation.changes.emptyLabel", undefined, "No accreditation changes")}
          emptyDescription={t(
            "console.accreditation.changes.emptyDescription",
            undefined,
            "Re-issue, role change, and revocation requests with audit trail.",
          )}
          emptyAction={
            <Button href="/studio/accreditation/changes/new" size="sm">
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
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/accreditation/changes"
          searchParams={sp}
        />
      </div>
    </>
  );
}
