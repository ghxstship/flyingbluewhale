import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createFormDefAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.forms.new.eyebrow", undefined, "Forms")}
        title={t("console.forms.new.title", undefined, "New Form")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createFormDefAction}
          cancelHref="/console/forms"
          submitLabel={t("console.forms.new.submit", undefined, "Create Form")}
        >
          <Input
            label={t("console.forms.new.slugLabel", undefined, "Slug")}
            name="slug"
            required
            maxLength={120}
            placeholder="incident-report"
            hint={t("console.forms.new.slugHint", undefined, "Lowercase, dashes ok. Used in the form's URL.")}
          />
          <Input label={t("console.forms.new.titleLabel", undefined, "Title")} name="title" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.forms.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
