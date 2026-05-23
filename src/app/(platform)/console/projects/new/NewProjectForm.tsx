"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { createProjectAction, type CreateProjectState } from "../actions";

type Option = { id: string; name: string };

export function NewProjectForm({ clients = [], venues = [] }: { clients?: Option[]; venues?: Option[] }) {
  const [state, formAction, pending] = useActionState<CreateProjectState, FormData>(createProjectAction, null);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input label="Project Name" name="name" required maxLength={120} />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
        <textarea name="description" rows={4} maxLength={2000} className="input-base mt-1.5 w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Start Date" name="startDate" type="date" />
        <Input label="End Date" name="endDate" type="date" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Client</label>
          <select name="clientId" className="input-base mt-1.5 w-full" defaultValue="">
            <option value="">— None —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Primary Venue</label>
          <select name="primaryVenueId" className="input-base mt-1.5 w-full" defaultValue="">
            <option value="">— None —</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input label="Budget (USD)" name="budget" type="number" min="0" step="0.01" placeholder="e.g. 1500000" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Geographic Scope</label>
          <select name="geographicScope" className="input-base mt-1.5 w-full" defaultValue="">
            <option value="">—</option>
            <option value="local">Local</option>
            <option value="regional">Regional</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Tour Structure</label>
          <select name="tourStructure" className="input-base mt-1.5 w-full" defaultValue="">
            <option value="">—</option>
            <option value="single_stop">Single Stop</option>
            <option value="multi_stop_sequential">Multi-Stop Sequential</option>
            <option value="simultaneous_multi_city">Simultaneous Multi-City</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Production Style</label>
          <select name="productionStyle" className="input-base mt-1.5 w-full" defaultValue="">
            <option value="">—</option>
            <option value="editorial">Editorial</option>
            <option value="documentary">Documentary</option>
            <option value="narrative">Narrative</option>
            <option value="spectacle">Spectacle</option>
            <option value="intimate">Intimate</option>
            <option value="brutalist">Brutalist</option>
          </select>
        </div>
      </div>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex justify-end gap-2">
        <Button href="/console/projects" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
