import { ModuleHeader } from "@/components/Shell";
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
          eyebrow={t("console.legal.privacy.consent.eyebrow", undefined, "Workspace")}
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
  const rows = await listOrgScoped("consent_records", session.orgId, {
    orderBy: "granted_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.privacy.consent.eyebrow", undefined, "Workspace")}
        title={t("console.legal.privacy.consent.title", undefined, "Consent Records")}
        subtitle={
          rows.length === 1
            ? t("console.legal.privacy.consent.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.legal.privacy.consent.subtitleOther", { count: rows.length }, `${rows.length} Records`)
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
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
      </div>
    </>
  );
}
