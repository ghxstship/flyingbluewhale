import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createFlowAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.onboarding.new.eyebrow", undefined, "Onboarding")}
        title={t("console.workforce.onboarding.new.title", undefined, "New Flow")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createFlowAction}
          cancelHref="/console/workforce/onboarding"
          submitLabel={t("console.workforce.onboarding.new.submit", undefined, "Create Flow")}
        >
          <Input
            label={t("console.workforce.onboarding.new.name", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder={t("console.workforce.onboarding.new.namePlaceholder", undefined, "Day-1 Crew Onboarding")}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.onboarding.new.description", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.workforce.onboarding.new.targetRole", undefined, "Target role")}
            name="target_role"
            maxLength={80}
            placeholder={t(
              "console.workforce.onboarding.new.targetRolePlaceholder",
              undefined,
              "lighting-tech (optional)",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
