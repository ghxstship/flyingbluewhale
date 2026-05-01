import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateRateCardItem, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ itemId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rate_card_items", session.orgId, p.itemId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateRateCardItem.bind(null, p.itemId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Rate Card Item"
        title={`Edit ${((row as Record<string, unknown>)["name"] as string | undefined) ?? "Rate card item"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/logistics/ratecard/${p.itemId}`} submitLabel="Save Changes">
          <Input label="Name" name="name" defaultValue={row.name ?? ""} required maxLength={200} />
          <Input label="SKU" name="sku" defaultValue={row.sku ?? ""} required maxLength={80} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input
            label="Unit Price (Cents)"
            name="unit_price_cents"
            type="number"
            defaultValue={row.unit_price_cents != null ? String(row.unit_price_cents) : ""}
          />
          <Input label="Currency" name="currency" defaultValue={row.currency ?? ""} required maxLength={3} />
          <Input label="Catalog" name="catalog" defaultValue={row.catalog ?? ""} required maxLength={80} />
        </FormShell>
      </div>
    </>
  );
}
