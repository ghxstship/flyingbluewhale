import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateEnvEvent, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("environmental_events", session.orgId, eventId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateEnvEvent.bind(null, eventId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.environmental.edit.eyebrow", undefined, "Safety · Environmental")}
        title={t("console.safety.environmental.edit.title", undefined, "Edit Event")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/safety/environmental/${eventId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.safety.environmental.edit.kindLabel", undefined, "Kind")}
            </label>
            <select
              name="kind"
              defaultValue={(r.kind as string | undefined) ?? "heat"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="heat">{t("console.safety.environmental.edit.kind.heat", undefined, "Heat")}</option>
              <option value="cold">{t("console.safety.environmental.edit.kind.cold", undefined, "Cold")}</option>
              <option value="wind">{t("console.safety.environmental.edit.kind.wind", undefined, "Wind")}</option>
              <option value="storm">{t("console.safety.environmental.edit.kind.storm", undefined, "Storm")}</option>
              <option value="lightning">
                {t("console.safety.environmental.edit.kind.lightning", undefined, "Lightning")}
              </option>
              <option value="air_quality">
                {t("console.safety.environmental.edit.kind.airQuality", undefined, "Air quality")}
              </option>
              <option value="wildlife">
                {t("console.safety.environmental.edit.kind.wildlife", undefined, "Wildlife")}
              </option>
              <option value="biohazard">
                {t("console.safety.environmental.edit.kind.biohazard", undefined, "Biohazard")}
              </option>
              <option value="other">{t("console.safety.environmental.edit.kind.other", undefined, "Other")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.safety.environmental.edit.severityLabel", undefined, "Severity")}
            </label>
            <select
              name="severity"
              defaultValue={(r.severity as string | undefined) ?? "advisory"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="advisory">
                {t("console.safety.environmental.edit.severity.advisory", undefined, "Advisory")}
              </option>
              <option value="watch">{t("console.safety.environmental.edit.severity.watch", undefined, "Watch")}</option>
              <option value="warning">
                {t("console.safety.environmental.edit.severity.warning", undefined, "Warning")}
              </option>
              <option value="emergency">
                {t("console.safety.environmental.edit.severity.emergency", undefined, "Emergency")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.safety.environmental.edit.startedAtLabel", undefined, "Started At")}
            name="started_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.started_at)}
          />
          <Input
            label={t("console.safety.environmental.edit.endedAtLabel", undefined, "Ended At")}
            name="ended_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(r.ended_at)}
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
