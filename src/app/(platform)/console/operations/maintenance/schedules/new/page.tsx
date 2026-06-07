import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createSchedule } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.operations.maintenance.schedules.new.eyebrow", undefined, "Operations · Maintenance")}
        title={t("console.operations.maintenance.schedules.new.title", undefined, "New Schedule")}
      />
      <div className="page-content max-w-xl">
        <p className="mb-4 text-sm text-[var(--p-text-2)]">
          {t(
            "console.operations.maintenance.schedules.new.intro",
            undefined,
            "Author a recurring inspection / service / compliance check. The first job is materialised immediately; further jobs are spawned at each cadence interval.",
          )}
        </p>
        <FormShell
          action={createSchedule}
          cancelHref="/console/operations/maintenance"
          submitLabel={t("console.operations.maintenance.schedules.new.submit", undefined, "Create Schedule")}
        >
          <Input
            label={t("console.operations.maintenance.schedules.new.name.label", undefined, "Name")}
            name="name"
            maxLength={160}
            placeholder={t(
              "console.operations.maintenance.schedules.new.name.placeholder",
              undefined,
              "e.g. Scaffold load check — Stage A",
            )}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.operations.maintenance.schedules.new.kind.label", undefined, "Kind")}
            </label>
            <select name="kind" defaultValue="inspection" className="ps-input mt-1.5 w-full" required>
              <option value="inspection">
                {t(
                  "console.operations.maintenance.schedules.new.kind.inspection",
                  undefined,
                  "Inspection — Safety Walk, Scaffold Check",
                )}
              </option>
              <option value="service">
                {t(
                  "console.operations.maintenance.schedules.new.kind.service",
                  undefined,
                  "Service — Pre-show Diagnostic, Calibration",
                )}
              </option>
              <option value="cert_renewal">
                {t(
                  "console.operations.maintenance.schedules.new.kind.certRenewal",
                  undefined,
                  "Cert Renewal — Re-issuance, Re-test",
                )}
              </option>
              <option value="compliance">
                {t(
                  "console.operations.maintenance.schedules.new.kind.compliance",
                  undefined,
                  "Compliance — Audit, Regulator Submission",
                )}
              </option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.operations.maintenance.schedules.new.targetKind.label", undefined, "Target kind")}
            </label>
            <select name="target_kind" defaultValue="venue" className="ps-input mt-1.5 w-full" required>
              <option value="venue">
                {t("console.operations.maintenance.schedules.new.targetKind.venue", undefined, "Venue")}
              </option>
              <option value="equipment">
                {t("console.operations.maintenance.schedules.new.targetKind.equipment", undefined, "Equipment")}
              </option>
              <option value="credential">
                {t("console.operations.maintenance.schedules.new.targetKind.credential", undefined, "Credential")}
              </option>
              <option value="workforce">
                {t("console.operations.maintenance.schedules.new.targetKind.workforce", undefined, "Workforce member")}
              </option>
              <option value="custom">
                {t(
                  "console.operations.maintenance.schedules.new.targetKind.custom",
                  undefined,
                  "Custom — No Target Binding",
                )}
              </option>
            </select>
          </div>
          <Input
            label={t("console.operations.maintenance.schedules.new.targetId.label", undefined, "Target ID · Optional")}
            name="target_id"
            placeholder={t(
              "console.operations.maintenance.schedules.new.targetId.placeholder",
              undefined,
              "Paste a venue/equipment/credential id, or leave blank",
            )}
          />
          <Input
            label={t(
              "console.operations.maintenance.schedules.new.cadence.label",
              undefined,
              "Cadence — Days Between Runs",
            )}
            name="cadence_days"
            type="number"
            min={1}
            max={3650}
            defaultValue={7}
            required
          />
        </FormShell>
      </div>
    </>
  );
}
