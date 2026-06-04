import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createPollAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.polls.new.eyebrow", undefined, "Polls")}
        title={t("console.comms.polls.new.title", undefined, "New Poll")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPollAction}
          cancelHref="/console/comms/polls"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input
            label={t("console.comms.polls.new.questionLabel", undefined, "Question")}
            name="question"
            required
            maxLength={300}
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.comms.polls.new.optionsLabel", undefined, "Options (one per line, max 8)")}
            </label>
            <textarea
              name="options"
              rows={6}
              required
              placeholder={t("console.comms.polls.new.optionsPlaceholder", undefined, "Yes\nNo\nUnsure")}
              className="input-base mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.comms.polls.new.audienceLabel", undefined, "Audience")}
            </label>
            <select name="audience" className="input-base mt-1.5 w-full" defaultValue="all">
              <option value="all">{t("console.comms.polls.new.audienceAll", undefined, "All")}</option>
              <option value="crew">{t("console.comms.polls.new.audienceCrew", undefined, "Crew")}</option>
              <option value="contractors">
                {t("console.comms.polls.new.audienceContractors", undefined, "Contractors")}
              </option>
              <option value="vendors">{t("console.comms.polls.new.audienceVendors", undefined, "Vendors")}</option>
              <option value="admins">{t("console.comms.polls.new.audienceAdmins", undefined, "Admins")}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="publish_now" defaultChecked />{" "}
            {t("console.comms.polls.new.goLiveImmediately", undefined, "Go live immediately")}
          </label>
        </FormShell>
      </div>
    </>
  );
}
