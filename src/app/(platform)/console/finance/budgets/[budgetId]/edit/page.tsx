import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateBudget, type State } from "./actions";

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
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/finance/budgets/${p.budgetId}`}
          submitLabel={t("console.finance.budgets.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.finance.budgets.edit.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.finance.budgets.edit.category", undefined, "Category")}
            name="category"
            defaultValue={row.category ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.finance.budgets.edit.amountCents", undefined, "Amount (cents)")}
            name="amount_cents"
            type="number"
            defaultValue={String(row.amount_cents ?? 0)}
          />
          <p className="text-xs text-[var(--text-muted)]">
            {t(
              "console.finance.budgets.edit.spentHint",
              undefined,
              "Spent is computed from linked expenses + paid invoices on the detail page.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
