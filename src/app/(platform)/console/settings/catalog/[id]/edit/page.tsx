import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateCatalogItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, description, unit_cost_cents, inventory_qty")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const item = data as {
    id: string;
    kind: string;
    code: string;
    name: string;
    description: string | null;
    unit_cost_cents: number | null;
    inventory_qty: number | null;
  };

  return (
    <>
      <ModuleHeader eyebrow="Catalog" title={`Edit ${item.name}`} />
      <div className="page-content max-w-2xl">
        <FormShell action={updateCatalogItem} cancelHref={`/console/settings/catalog/${item.id}`} submitLabel="Save">
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" required className="input-base mt-1.5 w-full" defaultValue={item.kind}>
              <option value="credential">Credential</option>
              <option value="catering">Catering</option>
              <option value="radio">Radio</option>
              <option value="tool">Tool</option>
              <option value="equipment">Equipment</option>
              <option value="uniform">Uniform</option>
              <option value="travel">Travel</option>
              <option value="lodging">Lodging</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </div>
          <Input label="Code" name="code" required maxLength={64} defaultValue={item.code} />
          <Input label="Name" name="name" required maxLength={200} defaultValue={item.name} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={item.description ?? ""}
              className="input-base mt-1.5 w-full"
            />
          </div>
          <Input
            label="Unit cost (USD)"
            name="unit_cost_usd"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item.unit_cost_cents != null ? String(item.unit_cost_cents / 100) : ""}
          />
          <Input
            label="Inventory quantity"
            name="inventory_qty"
            type="number"
            step="1"
            min="0"
            defaultValue={item.inventory_qty != null ? String(item.inventory_qty) : ""}
          />
        </FormShell>
      </div>
    </>
  );
}
