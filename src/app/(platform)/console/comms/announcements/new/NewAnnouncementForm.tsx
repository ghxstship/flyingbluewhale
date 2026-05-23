"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createAnnouncementAction, type State } from "./actions";

/**
 * Announcement composer. Audience targeting works as three layered
 * filters that AND together (server-side fan-out reads all three):
 *
 *   • Role band   — coarse audience enum (all/crew/contractors/vendors/admins)
 *   • Project     — optional org-wide-OR-this-project scope
 *   • Team        — optional named-team scope
 *
 * Two distinct submit buttons (Save Draft + Publish Now) avoid the
 * old click-race between a publish-now checkbox and the submit. The
 * Publish Now button names `publish_now=on`; Save Draft doesn't.
 */
export function NewAnnouncementForm({
  projects,
  teams,
}: {
  projects: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createAnnouncementAction, null);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input label="Title" name="title" required maxLength={200} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Body</span>
        <textarea name="body" rows={6} required maxLength={8000} className="input-base focus-ring w-full" />
      </label>

      <fieldset className="space-y-3 rounded-md border border-[var(--border-color)] p-3">
        <legend className="px-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
          Audience
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Role Band</span>
            <select name="audience" className="input-base focus-ring w-full" defaultValue="all">
              <option value="all">Everyone</option>
              <option value="crew">Crew</option>
              <option value="contractors">Contractors</option>
              <option value="vendors">Vendors</option>
              <option value="admins">Admins</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Project</span>
            <select name="project_id" className="input-base focus-ring w-full" defaultValue="">
              <option value="">Org-wide (any project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Team</span>
            <select name="team_id" className="input-base focus-ring w-full" defaultValue="">
              <option value="">Any team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Filters AND together — recipients must match every populated filter. Leave Project + Team blank to reach the
          full role band.
        </p>
      </fieldset>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="pinned" /> Pin To Top Of Feed
      </label>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex items-center justify-end gap-2">
        <Button href="/console/comms/announcements" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save Draft"}
        </Button>
        <Button type="submit" name="publish_now" value="on" disabled={pending}>
          {pending ? "Publishing…" : "Publish Now"}
        </Button>
      </div>
    </form>
  );
}
