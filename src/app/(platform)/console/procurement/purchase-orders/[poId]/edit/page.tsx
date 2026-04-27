import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updatePurchaseOrder, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ poId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("purchase_orders", session.orgId, p.poId);
  if (!row) notFound();
  const action = updatePurchaseOrder.bind(null, p.poId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Purchase order" title={`Edit ${row.title}`} />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/procurement/purchase-orders/${p.poId}`}
          submitLabel="Save changes"
        >
          <Input label="Title" name="title" defaultValue={row.title} required maxLength={200} />
          <Input label="Number" name="number" defaultValue={row.number} required maxLength={80} />
          <Input
            label="Amount (cents)"
            name="amount_cents"
            type="number"
            defaultValue={String(row.amount_cents ?? 0)}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? "USD"} required maxLength={3} />
          <p className="text-xs text-[var(--text-muted)]">Status transitions are managed from the detail page.</p>
        </FormShell>
      </div>
    </>
  );
}
