"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createBeoAction } from "../actions";

type Option = { id: string; name: string };

export function NewBeoForm({ clients, projects }: { clients: Option[]; projects: Option[] }) {
  return (
    <FormShell action={createBeoAction} cancelHref="/studio/sales/beos" submitLabel="Create BEO">
      <Input label="Event name" name="event_name" required maxLength={200} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="client_id" className="text-xs font-medium text-[var(--p-text-2)]">Client</label>
          <select id="client_id" name="client_id" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">None</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="project_id" className="text-xs font-medium text-[var(--p-text-2)]">Project</label>
          <select id="project_id" name="project_id" className="ps-input mt-1.5 w-full" defaultValue="">
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Event date" name="event_date" type="date" />
        <Input label="Start time" name="start_time" type="time" />
        <Input label="End time" name="end_time" type="time" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Space" name="space" placeholder="Grand Ballroom" maxLength={160} />
        <Input label="Headcount" name="headcount" type="number" min={0} defaultValue={0} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Contact name" name="contact_name" maxLength={160} />
        <Input label="Contact email" name="contact_email" type="email" />
        <Input label="Contact phone" name="contact_phone" maxLength={40} />
      </div>

      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">Notes</label>
        <textarea id="notes" name="notes" rows={3} className="ps-input mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
