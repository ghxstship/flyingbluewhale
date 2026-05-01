import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateInvoice, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("invoices", session.orgId, p.invoiceId);
  if (!row) notFound();
  const action = updateInvoice.bind(null, p.invoiceId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Invoice" title={`Edit ${row.title}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/finance/invoices/${p.invoiceId}`} submitLabel="Save Changes">
          <Input label="Title" name="title" defaultValue={row.title} required maxLength={200} />
          <Input label="Number" name="number" defaultValue={row.number} required maxLength={80} />
          <Input
            label="Amount (cents)"
            name="amount_cents"
            type="number"
            defaultValue={String(row.amount_cents ?? 0)}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? "USD"} required maxLength={3} />
          <Input label="Issued" name="issued_at" type="date" defaultValue={dateOnly(row.issued_at)} />
          <Input label="Due" name="due_at" type="date" defaultValue={dateOnly(row.due_at)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={5}
              maxLength={4000}
              className="input-base focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">Status transitions are managed from the detail page.</p>
        </FormShell>
      </div>
    </>
  );
}
