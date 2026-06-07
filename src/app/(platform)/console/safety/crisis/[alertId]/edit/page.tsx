import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateAlert, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("crisis_alerts", session.orgId, alertId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateAlert.bind(null, alertId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.crisis.edit.eyebrow", undefined, "Safety · Crisis")}
        title={t("console.safety.crisis.edit.title", undefined, "Edit Alert")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/safety/crisis/${alertId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.safety.crisis.edit.titleLabel", undefined, "Title")}
            name="title"
            maxLength={200}
            defaultValue={(r.title as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.crisis.edit.bodyLabel", undefined, "Body")}
            </label>
            <textarea
              name="body"
              rows={5}
              maxLength={5000}
              className="ps-input mt-1.5 w-full"
              defaultValue={(r.body as string | undefined) ?? ""}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.crisis.edit.severityLabel", undefined, "Severity")}
            </label>
            <select
              name="severity"
              defaultValue={(r.severity as string | undefined) ?? "info"}
              className="ps-input mt-1.5 w-full"
            >
              <option value="info">{t("console.safety.crisis.edit.severityInfo", undefined, "Info")}</option>
              <option value="advisory">
                {t("console.safety.crisis.edit.severityAdvisory", undefined, "Advisory")}
              </option>
              <option value="warning">{t("console.safety.crisis.edit.severityWarning", undefined, "Warning")}</option>
              <option value="emergency">
                {t("console.safety.crisis.edit.severityEmergency", undefined, "Emergency")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.safety.crisis.edit.scheduledAtLabel", undefined, "Scheduled At")}
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.scheduled_at)}
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
