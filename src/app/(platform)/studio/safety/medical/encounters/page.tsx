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
          eyebrow={t("console.safety.medical.encounters.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.safety.medical.encounters.titleFallback", undefined, "Medical Encounters")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.medical.encounters.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("medical_encounters", session.orgId, {
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
        eyebrow={t("console.safety.medical.encounters.eyebrow", undefined, "Medical")}
        title={t("console.safety.medical.encounters.title", undefined, "Encounters")}
        subtitle={`${total} ${total === 1 ? t("console.safety.medical.encounters.recordSingular", undefined, "Record") : t("console.safety.medical.encounters.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/safety/medical/encounters/new" size="sm">
            {t("console.safety.medical.encounters.logEncounter", undefined, "+ Log encounter")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/safety/medical/encounters/${r.id}`}
          emptyLabel={t("console.safety.medical.encounters.emptyLabel", undefined, "No medical encounters")}
          emptyDescription={t(
            "console.safety.medical.encounters.emptyDescription",
            undefined,
            "Clinical encounters are retained per local record-law. Detail view holds triage, complaint, and disposition.",
          )}
          emptyAction={
            <Button href="/studio/safety/medical/encounters/new" size="sm">
              {t("console.safety.medical.encounters.logEncounter", undefined, "+ Log encounter")}
            </Button>
          }
          columns={[
            {
              key: "triage",
              header: t("console.safety.medical.encounters.columns.triage", undefined, "Triage"),
              render: (r) => String(r.triage ?? "—"),
              accessor: (r) => r.triage ?? null,
            },
            {
              key: "chief_complaint",
              header: t("console.safety.medical.encounters.columns.complaint", undefined, "Complaint"),
              render: (r) => String(r.chief_complaint ?? "—"),
              accessor: (r) => r.chief_complaint ?? null,
            },
            {
              key: "disposition",
              header: t("console.safety.medical.encounters.columns.disposition", undefined, "Disposition"),
              render: (r) => String(r.disposition ?? "—"),
              accessor: (r) => r.disposition ?? null,
            },
            {
              key: "created_at",
              header: t("console.safety.medical.encounters.columns.at", undefined, "At"),
              render: (r) => <span className="font-mono text-xs">{String(r.created_at ?? "—")}</span>,
              accessor: (r) => r.created_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/safety/medical/encounters"
          searchParams={sp}
        />
      </div>
    </>
  );
}
