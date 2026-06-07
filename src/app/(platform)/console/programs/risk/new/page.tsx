import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createRiskAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.risk.new.eyebrow", undefined, "Risk Register")}
        title={t("console.programs.risk.new.title", undefined, "New Risk")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createRiskAction}
          cancelHref="/console/programs/risk"
          submitLabel={t("console.programs.risk.new.submit", undefined, "Create Risk")}
        >
          <Input
            label={t("console.programs.risk.new.fields.title", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.risk.new.fields.description", undefined, "Description")}
            </label>
            <textarea name="description" rows={4} className="ps-input mt-1.5 w-full" maxLength={4000} />
          </div>
          <Input
            label={t("console.programs.risk.new.fields.category", undefined, "Category")}
            name="category"
            maxLength={80}
          />
        </FormShell>
      </div>
    </>
  );
}
