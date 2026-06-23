import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateExpense, type State } from "./actions";
import { XPMS_DEPARTMENTS, XPMS_DISCIPLINES, XPMS_PHASES } from "@/lib/finance/xpms-budget";

const SELECT_CLASS = "ps-input focus-ring w-full";

function XpmsSelect({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--p-text-2)]">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={SELECT_CLASS}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ expenseId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("expenses", session.orgId, p.expenseId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateExpense.bind(null, p.expenseId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.expenses.edit.eyebrow", undefined, "Expense")}
        title={t("console.finance.expenses.edit.title", { description: row.description }, `Edit ${row.description}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/finance/expenses/${p.expenseId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.finance.expenses.edit.descriptionLabel", undefined, "Description")}
            name="description"
            defaultValue={row.description}
            required
            maxLength={500}
          />
          {/* Dollar-denominated entry; MoneyInput submits canonical
              integer cents via its hidden `amount_cents` field. The old
              raw-cents input invited 100× entry errors. */}
          <MoneyInput
            label={t("console.finance.expenses.edit.amountLabel", undefined, "Amount")}
            name="amount_cents"
            defaultCents={row.amount_cents ?? 0}
          />
          <Input
            label={t("console.finance.expenses.edit.currencyLabel", undefined, "Currency")}
            name="currency"
            defaultValue={row.currency ?? "USD"}
            required
            maxLength={3}
          />
          {/* XPMS taxonomy parity with the create form. The expenses-
              rollup trigger keys off department + project_id to write
              into budgets.actual_cents. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <XpmsSelect
              label={t("console.finance.expenses.edit.departmentLabel", undefined, "Department — XPMS")}
              name="department"
              options={XPMS_DEPARTMENTS}
              defaultValue={(row as { department?: string | null }).department ?? ""}
            />
            <XpmsSelect
              label={t("console.finance.expenses.edit.disciplineLabel", undefined, "Discipline")}
              name="discipline"
              options={XPMS_DISCIPLINES}
              defaultValue={(row as { discipline?: string | null }).discipline ?? ""}
            />
            <XpmsSelect
              label={t("console.finance.expenses.edit.phaseLabel", undefined, "Phase (8-Gate)")}
              name="xpms_phase"
              options={XPMS_PHASES}
              defaultValue={(row as { xpms_phase?: string | null }).xpms_phase ?? ""}
            />
            <Input
              label={t("console.finance.expenses.edit.itemLabel", undefined, "Item")}
              name="item"
              defaultValue={(row as { item?: string | null }).item ?? ""}
              maxLength={120}
            />
            <Input
              label={t("console.finance.expenses.edit.vendorLabel", undefined, "Vendor")}
              name="vendor"
              defaultValue={(row as { vendor?: string | null }).vendor ?? ""}
              maxLength={160}
            />
            <Input
              label={t("console.finance.expenses.edit.categoryLabel", undefined, "Category — Legacy")}
              name="category"
              defaultValue={row.category ?? ""}
              maxLength={120}
            />
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.finance.expenses.edit.statusLabel", undefined, "Status")}
            </span>
            <select
              name="expense_state"
              defaultValue={row.expense_state}
              required
              className="ps-input focus-ring w-full"
            >
              <option value="pending">
                {t("console.finance.expenses.expense_state.pending", undefined, "pending")}
              </option>
              <option value="approved">
                {t("console.finance.expenses.expense_state.approved", undefined, "approved")}
              </option>
              <option value="rejected">
                {t("console.finance.expenses.expense_state.rejected", undefined, "rejected")}
              </option>
              <option value="reimbursed">
                {t("console.finance.expenses.expense_state.reimbursed", undefined, "reimbursed")}
              </option>
            </select>
          </label>
          <Input
            label={t("console.finance.expenses.edit.spentOnLabel", undefined, "Spent On")}
            name="spent_at"
            type="date"
            defaultValue={dateOnly(row.spent_at)}
            required
          />
        </FormShell>
      </div>
    </>
  );
}
