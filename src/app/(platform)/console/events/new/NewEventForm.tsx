"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { createEventAction } from "../actions";

export function NewEventForm({ projects, locations }: { projects: { id: string; name: string }[]; locations: { id: string; name: string }[] }) {
  return (
    <FormShell action={createEventAction} cancelHref="/console/events" submitLabel="Create event">
      <Input label="Name" name="name" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts" name="starts_at" type="datetime-local" required />
        <Input label="Ends" name="ends_at" type="datetime-local" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Project</label>
          <select name="project_id" className="input-base mt-1.5 w-full">
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Location</label>
          <select name="location_id" className="input-base mt-1.5 w-full">
            <option value="">— No location —</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={3} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
