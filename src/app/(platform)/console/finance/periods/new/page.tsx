import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";
import { createAccountingPeriodAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewAccountingPeriodPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.periods.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.periods.new.title", undefined, "New Accounting Period")}
        subtitle={t("console.finance.periods.new.subtitle", undefined, "Open a month, quarter, or fiscal period.")}
      />
      <div className="page-content">
        <FormShell action={createAccountingPeriodAction}>
          <div className="grid max-w-xl gap-4">
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.finance.periods.new.labelLabel", undefined, "Label")}
              </span>
              <Input
                name="period_label"
                required
                placeholder={t(
                  "console.finance.periods.new.labelPlaceholder",
                  undefined,
                  "e.g. June 2026 / Q2 2026 / FY2026",
                )}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.finance.periods.new.startsOn", undefined, "Starts on")}
              </span>
              <Input name="starts_on" type="date" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">
                {t("console.finance.periods.new.endsOn", undefined, "Ends on")}
              </span>
              <Input name="ends_on" type="date" required />
            </label>
            <div className="flex gap-2">
              <Button type="submit">{t("console.finance.periods.new.openPeriod", undefined, "Open Period")}</Button>
              <Button href="/console/finance/periods" variant="secondary">
                {t("common.cancel", undefined, "Cancel")}
              </Button>
            </div>
          </div>
        </FormShell>
      </div>
    </>
  );
}
