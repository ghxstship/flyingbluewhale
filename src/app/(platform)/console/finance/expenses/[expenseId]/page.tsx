export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";
import { deleteExpense } from "./edit/actions";

export default async function Page({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("expenses")
    .select(
      "id, description, amount_cents, currency, category, expense_state, spent_at, receipt_path, project_id, department, discipline, xpms_phase, item, vendor",
    )
    .eq("org_id", session.orgId)
    .eq("id", expenseId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow={t("console.finance.expenses.detail.eyebrow", undefined, "Finance")}
      title={(r) => r.description}
      subtitle={(r) => {
        // Prefer XPMS department; fall back to legacy category text.
        const dept =
          (r as unknown as { department?: string | null }).department ??
          r.category ??
          t("console.finance.expenses.detail.uncategorized", undefined, "uncategorized");
        return `${money(r.amount_cents)} · ${dept}`;
      }}
      breadcrumbs={[
        { label: t("console.finance.breadcrumb", undefined, "Finance"), href: "/console/finance" },
        { label: t("console.finance.expenses.breadcrumb", undefined, "Expenses"), href: "/console/finance/expenses" },
        { label: row?.description ?? t("console.finance.expenses.detail.fallbackTitle", undefined, "Expense") },
      ]}
      fields={
        row
          ? [
              {
                label: t("console.finance.expenses.detail.fields.expense_state", undefined, "Status"),
                value: <StatusBadge status={row.expense_state ?? "pending"} />,
              },
              {
                label: t("console.finance.expenses.detail.fields.amount", undefined, "Amount"),
                value: money(row.amount_cents),
              },
              {
                label: t("console.finance.expenses.detail.fields.currency", undefined, "Currency"),
                value: row.currency,
              },
              {
                label: t("console.finance.expenses.detail.fields.department", undefined, "Department"),
                value: (row as { department?: string | null }).department ?? row.category ?? "—",
              },
              {
                label: t("console.finance.expenses.detail.fields.discipline", undefined, "Discipline"),
                value: (row as { discipline?: string | null }).discipline ?? "—",
              },
              {
                label: t("console.finance.expenses.detail.fields.phase", undefined, "Phase"),
                value: (row as { xpms_phase?: string | null }).xpms_phase ?? "—",
              },
              {
                label: t("console.finance.expenses.detail.fields.item", undefined, "Item"),
                value: (row as { item?: string | null }).item ?? "—",
              },
              {
                label: t("console.finance.expenses.detail.fields.vendor", undefined, "Vendor"),
                value: (row as { vendor?: string | null }).vendor ?? "—",
              },
              {
                label: t("console.finance.expenses.detail.fields.spentOn", undefined, "Spent On"),
                value: fmtDate(row.spent_at),
              },
              {
                label: t("console.finance.expenses.detail.fields.receipt", undefined, "Receipt"),
                value: row.receipt_path
                  ? t("console.finance.expenses.detail.receipt.attached", undefined, "Attached")
                  : t("console.finance.expenses.detail.receipt.none", undefined, "None"),
              },
            ]
          : undefined
      }
      action={
        row ? (
          <div className="flex items-center gap-2">
            <Button href={`/console/finance/expenses/${expenseId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteExpense.bind(null, expenseId)}
              confirm={t(
                "console.finance.expenses.detail.deleteConfirm",
                { description: row.description },
                `Delete expense "${row.description}"? This cannot be undone.`,
              )}
            />
          </div>
        ) : undefined
      }
    />
  );
}
