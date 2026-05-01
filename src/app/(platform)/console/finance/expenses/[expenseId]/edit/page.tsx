import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateExpense, type State } from "./actions";

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
  const action = updateExpense.bind(null, p.expenseId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Expense" title={`Edit ${row.description}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/finance/expenses/${p.expenseId}`} submitLabel="Save Changes">
          <Input label="Description" name="description" defaultValue={row.description} required maxLength={500} />
          <Input
            label="Amount (cents)"
            name="amount_cents"
            type="number"
            defaultValue={String(row.amount_cents ?? 0)}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? "USD"} required maxLength={3} />
          <Input label="Category" name="category" defaultValue={row.category ?? ""} maxLength={120} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status} required className="input-base focus-ring w-full">
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="reimbursed">reimbursed</option>
            </select>
          </label>
          <Input label="Spent On" name="spent_at" type="date" defaultValue={dateOnly(row.spent_at)} required />
        </FormShell>
      </div>
    </>
  );
}
