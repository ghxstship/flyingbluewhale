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
          eyebrow={t("console.legal.ip.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.legal.ip.title", undefined, "Trademarks")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.legal.ip.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("trademarks", session.orgId, {
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
        eyebrow={t("console.legal.ip.eyebrow", undefined, "Legal · IP")}
        title={t("console.legal.ip.title", undefined, "Trademarks")}
        subtitle={`${total} ${total === 1 ? t("console.legal.ip.recordSingular", undefined, "Record") : t("console.legal.ip.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/legal/ip/new" size="sm">
            {t("console.legal.ip.registerMark", undefined, "+ Register mark")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/legal/ip/${r.id}`}
          emptyLabel={t("console.legal.ip.emptyLabel", undefined, "No trademarks tracked")}
          emptyDescription={t(
            "console.legal.ip.emptyDescription",
            undefined,
            "Register marks, monitor renewals, and track watch-service hits.",
          )}
          emptyAction={
            <Button href="/studio/legal/ip/new" size="sm">
              {t("console.legal.ip.registerMark", undefined, "+ Register mark")}
            </Button>
          }
          columns={[
            {
              key: "mark",
              header: t("console.legal.ip.column.mark", undefined, "Mark"),
              render: (r) => String(r.mark ?? "—"),
              accessor: (r) => r.mark ?? null,
            },
            {
              key: "jurisdiction",
              header: t("console.legal.ip.column.jurisdiction", undefined, "Jurisdiction"),
              render: (r) => String(r.jurisdiction ?? "—"),
              accessor: (r) => r.jurisdiction ?? null,
            },
            {
              key: "registration_no",
              header: t("console.legal.ip.column.registrationNo", undefined, "Reg No."),
              render: (r) => <span className="font-mono text-xs">{String(r.registration_no ?? "—")}</span>,
              accessor: (r) => r.registration_no ?? null,
            },
            {
              key: "status",
              header: t("console.legal.ip.column.status", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/legal/ip"
          searchParams={sp}
        />
      </div>
    </>
  );
}
