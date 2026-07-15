import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { IncidentPhotos } from "@/components/incidents/IncidentPhotos";
import { RecordActionButton } from "@/components/RecordActionButton";
import { createCorrectiveTaskAction } from "../actions";
import { deleteIncident } from "./edit/actions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const p = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.operations.incidents.detail.title", undefined, "Incident")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.operations.incidents.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("incidents", session.orgId, p.incidentId);
  const fmt = await getRequestFormatters();
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const summary = (fields["summary"] as string | undefined) ?? p.incidentId;
  const severity = (fields["severity"] as string | undefined) ?? "minor";
  const incidentState = (fields["incident_state"] as string | undefined) ?? "open";
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.incidents.detail.eyebrow", undefined, "Operations · Incident")}
        title={summary}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/operations/incidents" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
            {isManagerPlus(session) && incidentState !== "closed" && (
              <RecordActionButton
                action={createCorrectiveTaskAction.bind(null, p.incidentId)}
                label={t("console.operations.incidents.detail.createTask", undefined, "Create Corrective Task")}
                pendingLabel={t("console.operations.incidents.detail.creatingTask", undefined, "Creating…")}
              />
            )}
            <Button href={`/studio/operations/incidents/${p.incidentId}/edit`} size="sm">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteIncident.bind(null, p.incidentId)}
              confirm={t(
                "console.operations.incidents.detail.deleteConfirm",
                { summary },
                `Delete incident "${summary}"?`,
              )}
              undo={{ table: "incidents", id: p.incidentId, redirectTo: "/studio/operations/incidents" }}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <div className="surface p-5">
          <div className="flex items-center gap-3">
            <StatusChip tone={SEVERITY_TONE[severity] ?? "neutral"}>{severity}</StatusChip>
            <span className="text-xs text-[var(--p-text-2)]">
              {fields["occurred_at"] ? fmt.dateTime(String(fields["occurred_at"])) : "—"}
            </span>
          </div>
        </div>
        <IncidentPhotos photos={fields["photos"]} />
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields)
            // `photos` renders as the evidence panel above. Left in this
            // generic dump it was a JSON blob of storage paths — present,
            // unreadable, and impossible to actually look at.
            .filter(([k]) => k !== "photos")
            .map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <dt className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">{toTitle(k)}</dt>
                <dd className="font-mono text-xs break-all">
                  {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </>
  );
}
