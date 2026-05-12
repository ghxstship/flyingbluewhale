import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createCatalogItem } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Catalog" title="New Item" />
      <div className="page-content max-w-2xl">
        <FormShell action={createCatalogItem} cancelHref="/console/settings/catalog" submitLabel="Create">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" required className="input-base mt-1.5 w-full" defaultValue="credential">
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
          <Input
            label="Code"
            name="code"
            required
            maxLength={64}
            placeholder="crew-pass-tier1"
            hint="Short identifier. Lowercase, dashes ok."
          />
          <Input label="Name" name="name" required maxLength={200} placeholder="Crew Pass (Tier 1)" />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={1000} className="input-base mt-1.5 w-full" />
          </div>
          <Input
            label="Unit cost (USD)"
            name="unit_cost_usd"
            type="number"
            step="0.01"
            min="0"
            hint="Optional. Used for inventory roll-ups + cost-allocation reports."
          />
          <Input
            label="Inventory quantity"
            name="inventory_qty"
            type="number"
            step="1"
            min="0"
            hint="Optional. Total stock available across the org."
          />
        </FormShell>
      </div>
    </>
  );
}
