import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateIncident, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("incidents", session.orgId, incidentId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const { t } = await getRequestT();
  const action = updateIncident.bind(null, incidentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.incidents.edit.eyebrow", undefined, "Operations · Incident")}
        title={t("console.operations.incidents.edit.title", undefined, "Edit Incident")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/operations/incidents/${incidentId}`}
          submitLabel={t("console.operations.incidents.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.operations.incidents.edit.summaryLabel", undefined, "Summary")}
            name="summary"
            maxLength={500}
            defaultValue={(r.summary as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.operations.incidents.edit.descriptionLabel", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={4}
              maxLength={5000}
              className="input-base mt-1.5 w-full"
              defaultValue={(r.description as string | undefined) ?? ""}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.operations.incidents.edit.severityLabel", undefined, "Severity")}
            </label>
            <select
              name="severity"
              defaultValue={(r.severity as string | undefined) ?? "minor"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="near_miss">
                {t("console.operations.incidents.edit.severity.nearMiss", undefined, "Near miss")}
              </option>
              <option value="minor">{t("console.operations.incidents.edit.severity.minor", undefined, "Minor")}</option>
              <option value="major">{t("console.operations.incidents.edit.severity.major", undefined, "Major")}</option>
              <option value="critical">
                {t("console.operations.incidents.edit.severity.critical", undefined, "Critical")}
              </option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.operations.incidents.edit.statusLabel", undefined, "Status")}
            </label>
            <select
              name="status"
              defaultValue={(r.status as string | undefined) ?? "open"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="open">{t("console.operations.incidents.edit.status.open", undefined, "Open")}</option>
              <option value="investigating">
                {t("console.operations.incidents.edit.status.investigating", undefined, "Investigating")}
              </option>
              <option value="resolved">
                {t("console.operations.incidents.edit.status.resolved", undefined, "Resolved")}
              </option>
              <option value="closed">
                {t("console.operations.incidents.edit.status.closed", undefined, "Closed")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.operations.incidents.edit.locationLabel", undefined, "Location")}
            name="location"
            maxLength={200}
            defaultValue={(r.location as string | undefined) ?? ""}
          />
          <Input
            label={t("console.operations.incidents.edit.occurredAtLabel", undefined, "Occurred At")}
            name="occurred_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.occurred_at)}
          />
        </FormShell>
      </div>
    </>
  );
}

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}
