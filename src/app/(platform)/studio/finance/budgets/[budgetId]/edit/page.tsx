import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateBudget, type State } from "./actions";
import { EditBudgetForm } from "./EditBudgetForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ budgetId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("budgets", session.orgId, p.budgetId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateBudget.bind(null, p.budgetId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.budgets.edit.eyebrow", undefined, "Budget")}
        title={t("console.finance.budgets.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-3xl">
        <EditBudgetForm budgetId={p.budgetId} row={row as unknown as Record<string, unknown>} action={action} />
      </div>
    </>
  );
}
