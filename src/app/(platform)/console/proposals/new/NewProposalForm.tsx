"use client";

import { useRef, useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AiProposalDrafter } from "./AiProposalDrafter";
import { createProposalAction } from "../actions";

export function NewProposalForm({
  clients,
  projects,
  defaultClientId,
}: {
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  defaultClientId?: string;
}) {
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const [notesValue, setNotesValue] = useState("");

  function handleDraftReady(draft: string) {
    setNotesValue(draft);
    if (notesRef.current) notesRef.current.value = draft;
  }

  return (
    <div className="space-y-5">
      <AiProposalDrafter onDraftReady={handleDraftReady} />

      <FormShell action={createProposalAction} cancelHref="/console/proposals" submitLabel="Create Proposal">
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
          <textarea
            ref={notesRef}
            name="notes"
            rows={8}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="input-base mt-1.5 w-full"
            placeholder="Proposal scope and narrative — or generate with AI above."
          />
        </div>
      </FormShell>
    </div>
  );
}
