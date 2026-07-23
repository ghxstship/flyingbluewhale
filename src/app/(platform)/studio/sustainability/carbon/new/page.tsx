import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createMetric } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sustainability.carbon.new.eyebrow", undefined, "Sustainability · Carbon")}
        title={t("console.sustainability.carbon.new.title", undefined, "New Measurement")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createMetric}
          cancelHref="/studio/sustainability/carbon"
          submitLabel={t("console.sustainability.carbon.new.submit", undefined, "Record Measurement")}
        >
          <Input
            label={t("console.sustainability.carbon.new.periodStart", undefined, "Period Start")}
            name="period_start"
            type="date"
            required
          />
          <Input
            label={t("console.sustainability.carbon.new.periodEnd", undefined, "Period End")}
            name="period_end"
            type="date"
            required
          />
          <div>
            <label htmlFor="scope" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.sustainability.carbon.new.scope", undefined, "Scope")}
            </label>
            <select id="scope" name="scope" defaultValue="1" className="ps-input mt-1.5 w-full">
              <option value="1">{t("console.sustainability.carbon.new.scope1", undefined, "Scope 1 (direct)")}</option>
              <option value="2">
                {t("console.sustainability.carbon.new.scope2", undefined, "Scope 2 (purchased energy)")}
              </option>
              <option value="3">
                {t("console.sustainability.carbon.new.scope3", undefined, "Scope 3 (value chain)")}
              </option>
            </select>
          </div>
          <Input
            label={t("console.sustainability.carbon.new.kgCo2e", undefined, "kg CO₂e")}
            name="kg_co2e"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
            required
          />
          <Input
            label={t("console.sustainability.carbon.new.source", undefined, "Source")}
            name="source"
            maxLength={120}
            placeholder={t(
              "console.sustainability.carbon.new.sourcePlaceholder",
              undefined,
              "e.g. Utility bill, Fleet log",
            )}
          />
          <Input
            label={t("console.sustainability.carbon.new.method", undefined, "Method")}
            name="method"
            maxLength={120}
            placeholder={t(
              "console.sustainability.carbon.new.methodPlaceholder",
              undefined,
              "e.g. GHG Protocol, ISO 14064",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
