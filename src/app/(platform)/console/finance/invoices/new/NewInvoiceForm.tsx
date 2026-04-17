"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createInvoiceAction } from "../actions";

export function NewInvoiceForm({ clients, projects }: { clients: { id: string; name: string }[]; projects: { id: string; name: string }[] }) {
  return (
    <FormShell action={createInvoiceAction} cancelHref="/console/finance/invoices" submitLabel="Create invoice">
      <Input label="Title" name="title" required maxLength={200} placeholder="Event production retainer" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Client</label>
          <select name="client_id" className="input-base mt-1.5 w-full">
            <option value="">— No client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Amount" name="amount" type="number" inputMode="decimal" step="0.01" required />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Currency</label>
          <select name="currency" defaultValue="USD" className="input-base mt-1.5 w-full">
            <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
          </select>
        </div>
        <Input label="Due" name="due_at" type="date" />
      </div>
      <Input label="Issued" name="issued_at" type="date" />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea name="notes" rows={3} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
