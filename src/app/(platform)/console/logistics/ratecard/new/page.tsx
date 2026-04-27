import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createRateCardItem } from "./actions";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Logistics" title="New Rate-Card Item" />
      <div className="page-content max-w-xl">
        <FormShell action={createRateCardItem} cancelHref="/console/logistics/ratecard" submitLabel="Add item">
          <Input label="Catalog" name="catalog" required maxLength={60} placeholder="e.g. crew, transport, av" />
          <Input label="SKU" name="sku" required maxLength={80} placeholder="e.g. PA-MAIN-V2" />
          <Input label="Name" name="name" required maxLength={200} />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea name="description" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
          <Input label="Unit Price (USD)" name="unit_price" type="number" required step="0.01" min={0} />
          <Input label="Currency" name="currency" maxLength={3} defaultValue="USD" />
        </FormShell>
      </div>
    </>
  );
}
