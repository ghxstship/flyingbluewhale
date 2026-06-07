import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createEncounter } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.medical.encounters.new.eyebrow", undefined, "Medical · Encounter")}
        title={t("console.safety.medical.encounters.new.title", undefined, "Log Encounter")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createEncounter}
          cancelHref="/console/safety/medical/encounters"
          submitLabel={t("console.safety.medical.encounters.new.submit", undefined, "Log Encounter")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.medical.encounters.new.triage", undefined, "Triage")}
            </label>
            <select name="triage" defaultValue="green" className="ps-input mt-1.5 w-full">
              <option value="green">
                {t("console.safety.medical.encounters.new.triageGreen", undefined, "Green — Minor")}
              </option>
              <option value="yellow">
                {t("console.safety.medical.encounters.new.triageYellow", undefined, "Yellow — Urgent")}
              </option>
              <option value="red">
                {t("console.safety.medical.encounters.new.triageRed", undefined, "Red — Immediate")}
              </option>
              <option value="black">
                {t("console.safety.medical.encounters.new.triageBlack", undefined, "Black — Deceased")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.safety.medical.encounters.new.patientRef", undefined, "Patient Reference")}
            name="patient_ref"
            maxLength={120}
            placeholder={t("console.safety.medical.encounters.new.patientRefPlaceholder", undefined, "Pseudonymous ID")}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.medical.encounters.new.chiefComplaint", undefined, "Chief Complaint")}
            </label>
            <textarea name="chief_complaint" rows={3} maxLength={500} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.safety.medical.encounters.new.disposition", undefined, "Disposition")}
            name="disposition"
            maxLength={120}
            placeholder={t(
              "console.safety.medical.encounters.new.dispositionPlaceholder",
              undefined,
              "e.g. Discharged, Hospital transfer",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
