export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DetailShell, money, fmtDate } from "@/components/detail/DetailShell";


export default async function Page({ params }: { params: Promise<{ budgetId: string }> }) {
  const { budgetId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("budgets")
    .select("id, name, amount_cents, spent_cents, category, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("id", budgetId)
    .maybeSingle();
  return (
    <DetailShell
      row={row}
      eyebrow="Finance"
      title={(r) => `${r.name}`}
      subtitle={(r) => r.category}
      breadcrumbs={[{ label: "Finance", href: "/console/finance" }, { label: "Budgets", href: "/console/finance/budgets" }, { label: row?.name ?? "Budget" }]}
      fields={row ? [
        { label: "Budget", value: `${money(row.amount_cents)}` },
        { label: "Spent", value: `${money(row.spent_cents)}` },
        { label: "Remaining", value: `${money((row.amount_cents ?? 0) - (row.spent_cents ?? 0))}` },
        { label: "Category", value: row.category ?? "—" },
        { label: "Created", value: fmtDate(row.created_at) },
      ] : undefined}
    />
  );
}
