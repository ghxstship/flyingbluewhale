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
  const rows = await listOrgScoped("medical_encounters", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.medical.encounters.eyebrow", undefined, "Medical")}
        title={t("console.safety.medical.encounters.title", undefined, "Encounters")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.safety.medical.encounters.recordSingular", undefined, "Record") : t("console.safety.medical.encounters.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/console/safety/medical/encounters/new" size="sm">
            {t("console.safety.medical.encounters.logEncounter", undefined, "+ Log encounter")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/safety/medical/encounters/${r.id}`}
          emptyLabel={t("console.safety.medical.encounters.emptyLabel", undefined, "No medical encounters")}
          emptyDescription={t(
            "console.safety.medical.encounters.emptyDescription",
            undefined,
            "Clinical encounters are retained per local record-law. Detail view holds triage, complaint, and disposition.",
          )}
          emptyAction={
            <Button href="/console/safety/medical/encounters/new" size="sm">
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
      </div>
    </>
  );
}
