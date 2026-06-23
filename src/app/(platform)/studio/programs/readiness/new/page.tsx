import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createExercise } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.readiness.new.eyebrow", undefined, "Programs · Readiness")}
        title={t("console.programs.readiness.new.title", undefined, "New Exercise")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createExercise}
          cancelHref="/studio/programs/readiness"
          submitLabel={t("console.programs.readiness.new.submit", undefined, "Schedule Exercise")}
        >
          <Input
            label={t("console.programs.readiness.new.name", undefined, "Name")}
            name="name"
            maxLength={200}
            placeholder={t("console.programs.readiness.new.namePlaceholder", undefined, "e.g. Stadium evacuation TTX")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.readiness.new.kind", undefined, "Kind")}
            </label>
            <select name="kind" defaultValue="tabletop" className="ps-input mt-1.5 w-full">
              <option value="tabletop">
                {t("console.programs.readiness.new.kindTabletop", undefined, "Tabletop")}
              </option>
              <option value="walkthrough">
                {t("console.programs.readiness.new.kindWalkthrough", undefined, "Walkthrough")}
              </option>
              <option value="functional">
                {t("console.programs.readiness.new.kindFunctional", undefined, "Functional")}
              </option>
              <option value="full_scale">
                {t("console.programs.readiness.new.kindFullScale", undefined, "Full-scale")}
              </option>
              <option value="aar">
                {t("console.programs.readiness.new.kindAar", undefined, "After-action review")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.programs.readiness.new.scheduledAt", undefined, "Scheduled At")}
            name="scheduled_at"
            type="datetime-local"
          />
        </FormShell>
      </div>
    </>
  );
}
