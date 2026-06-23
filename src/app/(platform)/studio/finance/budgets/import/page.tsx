import { ModuleHeader } from "@/components/ModuleHeader";
import { getRequestT } from "@/lib/i18n/request";
import { ImportBudgetForm } from "./ImportBudgetForm";

export const dynamic = "force-dynamic";

export default async function ImportBudgetPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.budgets.import.eyebrow", undefined, "Finance")}
        title={t("console.finance.budgets.import.title", undefined, "Import Budget — CSV / TSV")}
        subtitle={t(
          "console.finance.budgets.import.subtitle",
          undefined,
          "Paste rows from the XPMS Universal Budget Template's Budget tab. Column order is auto-detected from the header row.",
        )}
      />
      <div className="page-content max-w-4xl">
        <ImportBudgetForm />
      </div>
    </>
  );
}
