"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createLeadAction } from "../actions";

const STAGES = ["new", "qualified", "contacted", "proposal", "won", "lost"] as const;

export function NewLeadForm() {
  return (
    <FormShell action={createLeadAction} cancelHref="/console/leads" submitLabel="Create lead">
      <Input label="Name" name="name" required maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" name="email" type="email" />
        <Input label="Phone" name="phone" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Source" name="source" placeholder="Referral, web, event…" />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Stage</label>
          <select name="stage" defaultValue="new" className="input-base mt-1.5 w-full">
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <Input label="Estimated value (USD)" name="estimated_value" type="number" inputMode="decimal" step="0.01" />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes</label>
        <textarea name="notes" rows={3} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
