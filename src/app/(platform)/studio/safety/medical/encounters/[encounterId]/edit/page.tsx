import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateEncounter, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("medical_encounters", session.orgId, encounterId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const { t } = await getRequestT();
  const action = updateEncounter.bind(null, encounterId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.medical.encounters.edit.eyebrow", undefined, "Medical · Encounter")}
        title={t("console.safety.medical.encounters.edit.title", undefined, "Edit Encounter")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/safety/medical/encounters/${encounterId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <div>
            <label htmlFor="triage" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.medical.encounters.edit.triageLabel", undefined, "Triage")}
            </label>
            <select id="triage"
              name="triage"
              defaultValue={(r.triage as string | undefined) ?? "green"}
              className="ps-input mt-1.5 w-full"
            >
              <option value="green">
                {t("console.safety.medical.encounters.edit.triageGreen", undefined, "Green (Minor)")}
              </option>
              <option value="yellow">
                {t("console.safety.medical.encounters.edit.triageYellow", undefined, "Yellow (Urgent)")}
              </option>
              <option value="red">
                {t("console.safety.medical.encounters.edit.triageRed", undefined, "Red (Immediate)")}
              </option>
              <option value="black">
                {t("console.safety.medical.encounters.edit.triageBlack", undefined, "Black (Deceased)")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.safety.medical.encounters.edit.patientRefLabel", undefined, "Patient Reference")}
            name="patient_ref"
            maxLength={120}
            defaultValue={(r.patient_ref as string | undefined) ?? ""}
          />
          <div>
            <label htmlFor="chief_complaint" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.medical.encounters.edit.chiefComplaintLabel", undefined, "Chief Complaint")}
            </label>
            <textarea id="chief_complaint"
              name="chief_complaint"
              rows={3}
              maxLength={500}
              className="ps-input mt-1.5 w-full"
              defaultValue={(r.chief_complaint as string | undefined) ?? ""}
            />
          </div>
          <Input
            label={t("console.safety.medical.encounters.edit.dispositionLabel", undefined, "Disposition")}
            name="disposition"
            maxLength={120}
            defaultValue={(r.disposition as string | undefined) ?? ""}
          />
        </FormShell>
      </div>
    </>
  );
}
