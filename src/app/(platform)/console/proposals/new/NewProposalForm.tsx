"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createProposalAction } from "../actions";

export function NewProposalForm({
  clients,
  projects,
  defaultClientId,
  template,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  defaultClientId?: string;
  template?: { id: string; name: string; blockCount: number } | null;
}) {
  return (
    <FormShell action={createProposalAction} cancelHref="/console/proposals" submitLabel="Create Proposal">
      {template && (
        <>
          <input type="hidden" name="template_id" value={template.id} />
          <div className="surface-inset rounded-md p-3 text-xs">
            <div className="font-semibold tracking-wide text-[var(--text-muted)] uppercase">Template</div>
            <div className="mt-1">
              {template.name} · {template.blockCount} block{template.blockCount === 1 ? "" : "s"}
            </div>
          </div>
        </>
      )}
      <Input label="Title" name="title" required maxLength={200} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Client</label>
          <select name="client_id" defaultValue={defaultClientId ?? ""} className="input-base mt-1.5 w-full">
            <option value="">— No client —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project</label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">— No project —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Amount (USD)" name="amount" type="number" inputMode="decimal" step="0.01" />
        <Input label="Expires" name="expires_at" type="date" />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Notes / scope</label>
        <textarea name="notes" rows={5} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
