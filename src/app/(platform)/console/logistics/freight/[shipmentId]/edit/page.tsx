import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateShipment, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ shipmentId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("purchase_orders", session.orgId, p.shipmentId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateShipment.bind(null, p.shipmentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Shipment"
        title={`Edit ${((row as Record<string, unknown>)["title"] as string | undefined) ?? "Shipment"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/logistics/freight/${p.shipmentId}`} submitLabel="Save changes">
          <Input label="Title" name="title" defaultValue={row.title ?? ""} required maxLength={200} />
          <Input label="Number" name="number" defaultValue={row.number ?? ""} required maxLength={80} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="acknowledged">acknowledged</option>
              <option value="fulfilled">fulfilled</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <Input
            label="Amount (cents)"
            name="amount_cents"
            type="number"
            defaultValue={row.amount_cents != null ? String(row.amount_cents) : ""}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? ""} required maxLength={3} />
        </FormShell>
      </div>
    </>
  );
}
