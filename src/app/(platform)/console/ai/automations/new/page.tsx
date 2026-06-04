import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createAutomationAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.automations.new.eyebrow", undefined, "Automations")}
        title={t("console.ai.automations.new.title", undefined, "New Automation")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createAutomationAction}
          cancelHref="/console/ai/automations"
          submitLabel={t("console.ai.automations.new.submit", undefined, "Create Automation")}
        >
          <Input label={t("console.ai.automations.new.name", undefined, "Name")} name="name" required maxLength={120} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.ai.automations.new.description", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.ai.automations.new.trigger", undefined, "Trigger")}
            </label>
            <select name="trigger_kind" defaultValue="manual" className="input-base mt-1.5 w-full">
              <option value="manual">{t("console.ai.automations.new.triggerManual", undefined, "Manual")}</option>
              <option value="schedule">
                {t("console.ai.automations.new.triggerSchedule", undefined, "Schedule (cron)")}
              </option>
              <option value="webhook">{t("console.ai.automations.new.triggerWebhook", undefined, "Webhook")}</option>
              <option value="event">{t("console.ai.automations.new.triggerEvent", undefined, "Event")}</option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
