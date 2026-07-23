import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createRoster } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.rosters.new.eyebrow", undefined, "Workforce · Rosters")}
        title={t("console.workforce.rosters.new.title", undefined, "New Roster")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createRoster}
          cancelHref="/studio/workforce/rosters"
          submitLabel={t("console.workforce.rosters.new.submit", undefined, "Create Roster")}
        >
          <Input
            label={t("console.workforce.rosters.new.name.label", undefined, "Name")}
            name="name"
            maxLength={160}
            placeholder={t("console.workforce.rosters.new.name.placeholder", undefined, "e.g. Day-3 Stadium Crew")}
            required
          />
          <Input
            label={t("console.workforce.rosters.new.dayOf.label", undefined, "Day Of")}
            name="day_of"
            type="date"
            required
          />
          <div>
            <label htmlFor="state" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.rosters.new.state.label", undefined, "Status")}
            </label>
            <select id="state" name="state" defaultValue="draft" className="ps-input mt-1.5 w-full">
              <option value="draft">{t("console.workforce.rosters.new.state.draft", undefined, "Draft")}</option>
              <option value="published">
                {t("console.workforce.rosters.new.state.published", undefined, "Published")}
              </option>
              <option value="locked">{t("console.workforce.rosters.new.state.locked", undefined, "Locked")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
