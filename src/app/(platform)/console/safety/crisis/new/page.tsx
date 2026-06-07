import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCrisisAlertAction } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.crisis.new.eyebrow", undefined, "Crisis")}
        title={t("console.safety.crisis.new.title", undefined, "New Alert")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createCrisisAlertAction}
          cancelHref="/console/safety/crisis"
          submitLabel={t("console.safety.crisis.new.submit", undefined, "Send Alert")}
        >
          <Input
            label={t("console.safety.crisis.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.crisis.new.bodyLabel", undefined, "Body")}
            </label>
            <textarea name="body" rows={4} required maxLength={4000} className="ps-input mt-1.5 w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.safety.crisis.new.severityLabel", undefined, "Severity")}
            </label>
            <select name="severity" defaultValue="info" className="ps-input mt-1.5 w-full">
              <option value="info">{t("console.safety.crisis.new.severity.info", undefined, "Info")}</option>
              <option value="warn">{t("console.safety.crisis.new.severity.warn", undefined, "Warning")}</option>
              <option value="critical">
                {t("console.safety.crisis.new.severity.critical", undefined, "Critical")}
              </option>
            </select>
          </div>
        </FormShell>
      </div>
    </>
  );
}
