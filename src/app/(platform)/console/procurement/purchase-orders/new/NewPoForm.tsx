"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createPoAction } from "../actions";

export function NewPoForm({ vendors, projects }: { vendors: { id: string; name: string }[]; projects: { id: string; name: string }[] }) {
  return (
    <FormShell action={createPoAction} cancelHref="/console/procurement/purchase-orders" submitLabel="Create PO">
      <Input label="Title" name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Vendor</label>
          <select name="vendor_id" className="input-base mt-1.5 w-full">
            <option value="">— No vendor —</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project</label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <Input label="Amount (USD)" name="amount" type="number" step="0.01" required />
    </FormShell>
  );
}
