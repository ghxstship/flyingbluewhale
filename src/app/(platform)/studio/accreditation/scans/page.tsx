import { ModuleHeader } from "@/components/Shell";
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
          eyebrow={t("console.accreditation.scans.eyebrow", undefined, "Workspace")}
          title={t("console.accreditation.scans.title", undefined, "Gate Scans")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.scans.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("access_scans", session.orgId, {
    orderBy: "scanned_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.scans.eyebrow", undefined, "Workspace")}
        title={t("console.accreditation.scans.title", undefined, "Gate Scans")}
        subtitle={
          total === 1
            ? t("console.accreditation.scans.subtitleOne", { count: total }, `${total} Record`)
            : t("console.accreditation.scans.subtitleOther", { count: total }, `${total} Records`)
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          columns={[
            {
              key: "result",
              header: t("console.accreditation.scans.columns.result", undefined, "Result"),
              render: (r) => String(r.result ?? "—"),
              accessor: (r) => r.result ?? null,
            },
            {
              key: "reason",
              header: t("console.accreditation.scans.columns.reason", undefined, "Reason"),
              render: (r) => String(r.reason ?? "—"),
              accessor: (r) => r.reason ?? null,
            },
            {
              key: "gate_code",
              header: t("console.accreditation.scans.columns.gate", undefined, "Gate"),
              render: (r) => <span className="font-mono text-xs">{String(r.gate_code ?? "—")}</span>,
              accessor: (r) => r.gate_code ?? null,
            },
            {
              key: "scanned_at",
              header: t("console.accreditation.scans.columns.at", undefined, "At"),
              render: (r) => <span className="font-mono text-xs">{String(r.scanned_at ?? "—")}</span>,
              accessor: (r) => r.scanned_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/accreditation/scans"
          searchParams={sp}
        />
      </div>
    </>
  );
}
