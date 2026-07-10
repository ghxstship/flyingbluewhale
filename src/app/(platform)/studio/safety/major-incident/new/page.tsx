import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createMajorIncident } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.majorIncident.new.eyebrow", undefined, "Safety · Major Incident")}
        title={t("console.safety.majorIncident.new.title", undefined, "Activate Plan")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createMajorIncident}
          cancelHref="/studio/safety/major-incident"
          submitLabel={t("console.safety.majorIncident.new.submit", undefined, "Activate")}
        >
          <Input
            label={t("console.safety.majorIncident.new.nameLabel", undefined, "Name")}
            name="name"
            maxLength={200}
            placeholder={t(
              "console.safety.majorIncident.new.namePlaceholder",
              undefined,
              "e.g. Stand collapse · Stadium A",
            )}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.majorIncident.new.statusLabel", undefined, "Status")}
            </label>
            <select name="incident_state" defaultValue="activated" className="ps-input mt-1.5 w-full">
              <option value="activated">
                {t("console.safety.majorIncident.new.statusActivated", undefined, "Activated")}
              </option>
              <option value="ongoing">
                {t("console.safety.majorIncident.new.statusOngoing", undefined, "Ongoing")}
              </option>
              <option value="recovery">
                {t("console.safety.majorIncident.new.statusRecovery", undefined, "Recovery")}
              </option>
              <option value="closed">{t("console.safety.majorIncident.new.statusClosed", undefined, "Closed")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
