import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createSheetAction } from "../actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.sheets.new.eyebrow", undefined, "Sheets")}
        title={t("console.collaborate.sheets.new.title", undefined, "New Sheet")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createSheetAction}
          cancelHref="/studio/collaborate/sheets"
          submitLabel={t("console.collaborate.sheets.new.submit", undefined, "Create Sheet")}
        >
          <Input
            label={t("console.collaborate.sheets.new.fields.name", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder={t("console.collaborate.sheets.new.placeholders.name", undefined, "Q3 Crew Tracker")}
          />
          <div>
            <label htmlFor="sheet-description" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.collaborate.sheets.new.fields.description", undefined, "Description")}
            </label>
            <textarea
              id="sheet-description"
              name="description"
              rows={3}
              maxLength={4000}
              className="ps-input mt-1.5 w-full"
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
