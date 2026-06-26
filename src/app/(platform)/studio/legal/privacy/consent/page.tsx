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
          eyebrow={t("console.legal.privacy.consent.eyebrow", undefined, "Legal")}
          title={t("console.legal.privacy.consent.title", undefined, "Consent Records")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.legal.privacy.consent.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("consent_records", session.orgId, {
    orderBy: "granted_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.privacy.consent.eyebrow", undefined, "Legal")}
        title={t("console.legal.privacy.consent.title", undefined, "Consent Records")}
        subtitle={
          total === 1
            ? t("console.legal.privacy.consent.subtitleOne", { count: total }, `${total} Record`)
            : t("console.legal.privacy.consent.subtitleOther", { count: total }, `${total} Records`)
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          columns={[
            {
              key: "purpose",
              header: t("console.legal.privacy.consent.columns.purpose", undefined, "Purpose"),
              render: (r) => String(r.purpose ?? "—"),
              accessor: (r) => r.purpose ?? null,
            },
            {
              key: "granted",
              header: t("console.legal.privacy.consent.columns.granted", undefined, "Granted"),
              render: (r) => String(r.granted ?? "—"),
              accessor: (r) => r.granted ?? null,
            },
            {
              key: "version",
              header: t("console.legal.privacy.consent.columns.version", undefined, "Version"),
              render: (r) => <span className="font-mono text-xs">{String(r.version ?? "—")}</span>,
              accessor: (r) => r.version ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/legal/privacy/consent"
          searchParams={sp}
        />
      </div>
    </>
  );
}
