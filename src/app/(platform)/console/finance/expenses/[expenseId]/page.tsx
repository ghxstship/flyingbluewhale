export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function Page({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("expenses")
    .select("id, description, amount_cents, currency, category, status, spent_at, receipt_path, project_id")
    .eq("org_id", session.orgId)
    .eq("id", expenseId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Finance"
      title={(r) => r.description}
      subtitle={(r) => `${money(r.amount_cents)} · ${r.category ?? "uncategorized"}`}
      breadcrumbs={[{ label: "Finance", href: "/console/finance" }, { label: "Expenses", href: "/console/finance/expenses" }, { label: row?.description ?? "Expense" }]}
      fields={row ? [
        { label: "Status", value: <StatusBadge status={row.status ?? "pending"} /> },
        { label: "Amount", value: money(row.amount_cents) },
        { label: "Currency", value: row.currency },
        { label: "Category", value: row.category ?? "—" },
        { label: "Spent on", value: fmtDate(row.spent_at) },
        { label: "Receipt", value: row.receipt_path ? "Attached" : "None" },
      ] : undefined}
    />
  );
}
