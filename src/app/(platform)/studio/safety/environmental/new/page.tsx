import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createEnvEvent } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.environmental.new.eyebrow", undefined, "Safety · Environmental")}
        title={t("console.safety.environmental.new.title", undefined, "Log Event")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createEnvEvent}
          cancelHref="/studio/safety/environmental"
          submitLabel={t("console.safety.environmental.new.submit", undefined, "Log Event")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.environmental.new.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" defaultValue="heat" className="ps-input mt-1.5 w-full" required>
              <option value="heat">{t("console.safety.environmental.new.kind.heat", undefined, "Heat")}</option>
              <option value="cold">{t("console.safety.environmental.new.kind.cold", undefined, "Cold")}</option>
              <option value="wind">{t("console.safety.environmental.new.kind.wind", undefined, "Wind")}</option>
              <option value="storm">{t("console.safety.environmental.new.kind.storm", undefined, "Storm")}</option>
              <option value="lightning">
                {t("console.safety.environmental.new.kind.lightning", undefined, "Lightning")}
              </option>
              <option value="air_quality">
                {t("console.safety.environmental.new.kind.airQuality", undefined, "Air quality")}
              </option>
              <option value="wildlife">
                {t("console.safety.environmental.new.kind.wildlife", undefined, "Wildlife")}
              </option>
              <option value="biohazard">
                {t("console.safety.environmental.new.kind.biohazard", undefined, "Biohazard")}
              </option>
              <option value="other">{t("console.safety.environmental.new.kind.other", undefined, "Other")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.environmental.new.severityLabel", undefined, "Severity")}
            </label>
            <select name="severity" defaultValue="advisory" className="ps-input mt-1.5 w-full" required>
              <option value="advisory">
                {t("console.safety.environmental.new.severity.advisory", undefined, "Advisory")}
              </option>
              <option value="watch">{t("console.safety.environmental.new.severity.watch", undefined, "Watch")}</option>
              <option value="warning">
                {t("console.safety.environmental.new.severity.warning", undefined, "Warning")}
              </option>
              <option value="emergency">
                {t("console.safety.environmental.new.severity.emergency", undefined, "Emergency")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.safety.environmental.new.startedAt", undefined, "Started At")}
            name="started_at"
            type="datetime-local"
          />
          <Input
            label={t("console.safety.environmental.new.endedAt", undefined, "Ended At")}
            name="ended_at"
            type="datetime-local"
          />
        </FormShell>
      </div>
    </>
  );
}
