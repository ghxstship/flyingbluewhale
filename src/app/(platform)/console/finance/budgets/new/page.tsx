import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewBudgetForm } from "./NewBudgetForm";

export default async function NewBudgetPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.budgets.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.budgets.new.title", undefined, "New Budget")}
      />
      <div className="page-content max-w-xl">
        <NewBudgetForm />
      </div>
    </>
  );
}
