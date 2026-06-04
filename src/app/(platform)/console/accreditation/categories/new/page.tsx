import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCategory } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.categories.new.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.categories.new.title", undefined, "New Category")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createCategory}
          cancelHref="/console/accreditation/categories"
          submitLabel={t("console.accreditation.categories.new.submit", undefined, "Add Category")}
        >
          <Input
            label={t("console.accreditation.categories.new.codeLabel", undefined, "Code")}
            name="code"
            maxLength={40}
            placeholder={t("console.accreditation.categories.new.codePlaceholder", undefined, "e.g. ATH, OFF, MED")}
            required
          />
          <Input
            label={t("console.accreditation.categories.new.nameLabel", undefined, "Name")}
            name="name"
            maxLength={120}
            placeholder={t("console.accreditation.categories.new.namePlaceholder", undefined, "e.g. Athletes")}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.accreditation.categories.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={500} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.accreditation.categories.new.colorLabel", undefined, "Color (hex or token)")}
            name="color"
            maxLength={20}
            placeholder={t("console.accreditation.categories.new.colorPlaceholder", undefined, "hex or var(--token)")}
          />
        </FormShell>
      </div>
    </>
  );
}
