import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createSurveyAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.surveys.new.eyebrow", undefined, "Surveys")}
        title={t("console.comms.surveys.new.title", undefined, "New Survey")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createSurveyAction}
          cancelHref="/console/comms/surveys"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.comms.surveys.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.surveys.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.comms.surveys.new.audienceLabel", undefined, "Audience")}
            </label>
            <select name="audience" className="ps-input mt-1.5 w-full" defaultValue="all">
              <option value="all">{t("console.comms.surveys.new.audience.all", undefined, "All")}</option>
              <option value="crew">{t("console.comms.surveys.new.audience.crew", undefined, "Crew")}</option>
              <option value="contractors">
                {t("console.comms.surveys.new.audience.contractors", undefined, "Contractors")}
              </option>
              <option value="vendors">{t("console.comms.surveys.new.audience.vendors", undefined, "Vendors")}</option>
              <option value="admins">{t("console.comms.surveys.new.audience.admins", undefined, "Admins")}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="anonymous" />{" "}
            {t("console.comms.surveys.new.anonymous", undefined, "Anonymous responses")}
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="publish_now" />{" "}
            {t("console.comms.surveys.new.publishNow", undefined, "Publish immediately")}
          </label>
        </FormShell>
      </div>
    </>
  );
}
