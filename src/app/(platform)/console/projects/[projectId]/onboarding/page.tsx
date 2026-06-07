import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOnboardingByProject } from "@/lib/db/onboarding";
import { getOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";
import type { Project } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// DataTable<T> requires `T extends { id: string }`; map letter_id→id at the
// row level so DataTable can use the offer-letter id as the row identity.
type Row = {
  id: string;
  letter_id: string;
  recipient_name: string;
  total: number;
  done: number;
  critical_path_open: number;
};

export default async function ProjectOnboardingPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const project = await getOrgScoped("projects", session.orgId, projectId);
  if (!project) notFound();
  const { t } = await getRequestT();

  const rawRows = await listOnboardingByProject(session.orgId, projectId);
  const rows: Row[] = rawRows.map((r) => ({ ...r, id: r.letter_id }));
  const totalCp = rows.reduce((s, r) => s + r.critical_path_open, 0);
  const fullyDone = rows.filter((r) => r.total > 0 && r.done === r.total).length;
  const subtitle = t(
    "console.projects.onboarding.subtitle",
    { count: rows.length, done: fullyDone, total: rows.length, cp: totalCp },
    `${rows.length} crew · ${fullyDone}/${rows.length} fully onboarded · ${totalCp} critical-path items open`,
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.projects.onboarding.eyebrow", undefined, "Onboarding")}
        title={t(
          "console.projects.onboarding.title",
          { name: (project as unknown as Project).name },
          (project as unknown as Project).name + " — Onboarding",
        )}
        subtitle={subtitle}
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/people/offer-letters/${r.letter_id}/onboarding`}
          columns={[
            {
              key: "name",
              header: t("console.projects.onboarding.col.recipient", undefined, "Recipient"),
              render: (r) => <span className="font-medium">{r.recipient_name}</span>,
              accessor: (r) => r.recipient_name,
            },
            {
              key: "progress",
              header: t("console.projects.onboarding.col.progress", undefined, "Progress"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.done}/{r.total}{" "}
                  {r.total > 0 && r.done === r.total ? (
                    <Badge variant="success">{t("console.projects.onboarding.done", undefined, "Done")}</Badge>
                  ) : null}
                </span>
              ),
              accessor: (r) => (r.total ? r.done / r.total : 0),
            },
            {
              key: "cp",
              header: t("console.projects.onboarding.col.criticalPathOpen", undefined, "Critical-path open"),
              render: (r) =>
                r.critical_path_open > 0 ? (
                  <Badge variant="warning">{r.critical_path_open}</Badge>
                ) : (
                  <span className="text-[var(--p-text-3)]">—</span>
                ),
              accessor: (r) => r.critical_path_open,
              filterable: true,
            },
          ]}
        />
        <div className="surface mt-6 p-4 text-xs text-[var(--p-text-3)]">
          {t(
            "console.projects.onboarding.footnote",
            undefined,
            "Each row links to the per-recipient tracker. Recipients see their own live view at",
          )}{" "}
          <code className="font-mono">/offer/[token]/onboarding</code>.{" "}
          {t(
            "console.projects.onboarding.footnoteAudit",
            undefined,
            "Onboarding step changes auto-fire notifications to the assignee + watchers and write to the audit log via the annotations system.",
          )}
        </div>
      </div>
    </>
  );
}
