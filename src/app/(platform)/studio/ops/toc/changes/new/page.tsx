import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createChange } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ops.toc.changes.new.eyebrow", undefined, "Operations")}
        title={t("console.ops.toc.changes.new.title", undefined, "New Change Record")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createChange}
          cancelHref="/studio/ops/toc/changes"
          submitLabel={t("console.ops.toc.changes.new.submit", undefined, "Create Change")}
        >
          <Input
            label={t("console.ops.toc.changes.new.codeLabel", undefined, "Code")}
            name="code"
            required
            maxLength={40}
            placeholder="CHG-001"
          />
          <Input
            label={t("console.ops.toc.changes.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ops.toc.changes.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.ops.toc.changes.new.descriptionPlaceholder",
                undefined,
                "What is changing and why.",
              )}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ops.toc.changes.new.typeLabel", undefined, "Type")}
            </label>
            <select name="type" defaultValue="normal" className="ps-input mt-1.5 w-full">
              <option value="standard">
                {t("console.ops.toc.changes.new.typeStandard", undefined, "Standard — Pre-approved")}
              </option>
              <option value="normal">{t("console.ops.toc.changes.new.typeNormal", undefined, "Normal")}</option>
              <option value="emergency">
                {t("console.ops.toc.changes.new.typeEmergency", undefined, "Emergency")}
              </option>
              <option value="major">{t("console.ops.toc.changes.new.typeMajor", undefined, "Major")}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.ops.toc.changes.new.riskLabel", undefined, "Risk")}
              </label>
              <select name="risk" defaultValue="medium" className="ps-input mt-1.5 w-full">
                <option value="low">{t("console.ops.toc.changes.new.levelLow", undefined, "Low")}</option>
                <option value="medium">{t("console.ops.toc.changes.new.levelMedium", undefined, "Medium")}</option>
                <option value="high">{t("console.ops.toc.changes.new.levelHigh", undefined, "High")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.ops.toc.changes.new.impactLabel", undefined, "Impact")}
              </label>
              <select name="impact" defaultValue="medium" className="ps-input mt-1.5 w-full">
                <option value="low">{t("console.ops.toc.changes.new.levelLow", undefined, "Low")}</option>
                <option value="medium">{t("console.ops.toc.changes.new.levelMedium", undefined, "Medium")}</option>
                <option value="high">{t("console.ops.toc.changes.new.levelHigh", undefined, "High")}</option>
              </select>
            </div>
          </div>
          <Input
            label={t("console.ops.toc.changes.new.plannedStartLabel", undefined, "Planned Start")}
            name="planned_start"
            type="datetime-local"
          />
          <Input
            label={t("console.ops.toc.changes.new.plannedEndLabel", undefined, "Planned End")}
            name="planned_end"
            type="datetime-local"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.ops.toc.changes.new.backoutPlanLabel", undefined, "Backout plan")}
            </label>
            <textarea
              name="backout_plan"
              rows={3}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
              placeholder={t(
                "console.ops.toc.changes.new.backoutPlanPlaceholder",
                undefined,
                "How we revert if the change fails.",
              )}
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
