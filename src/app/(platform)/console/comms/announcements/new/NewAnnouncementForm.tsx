"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createAnnouncementAction, type State } from "./actions";

/**
 * Announcement composer. Uses two distinct submit buttons (Save Draft +
 * Publish Now) rather than a single submit + a publish-now checkbox so
 * the intent is unambiguous and there's no click-race between the
 * checkbox toggle and the submit. The Publish Now button names
 * `publish_now=on` in its submit; Save Draft doesn't include it, so
 * the server action reads draft vs published from FormData directly.
 */
export function NewAnnouncementForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(createAnnouncementAction, null);

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <Input label="Title" name="title" required maxLength={200} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Body</span>
        <textarea name="body" rows={6} required maxLength={8000} className="input-base focus-ring w-full" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Audience</span>
        <select name="audience" className="input-base focus-ring w-full" defaultValue="all">
          <option value="all">All</option>
          <option value="crew">Crew</option>
          <option value="contractors">Contractors</option>
          <option value="vendors">Vendors</option>
          <option value="admins">Admins</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" name="pinned" /> Pin To Top Of Feed
      </label>
      {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
      <div className="flex items-center justify-end gap-2">
        <Button href="/console/comms/announcements" variant="ghost">
          Cancel
        </Button>
        {/* Save Draft submit — no publish_now field included. */}
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save Draft"}
        </Button>
        {/* Publish Now submit — names `publish_now=on` so the server
            action reads it from FormData and fires the push fan-out. */}
        <Button type="submit" name="publish_now" value="on" disabled={pending}>
          {pending ? "Publishing…" : "Publish Now"}
        </Button>
      </div>
    </form>
  );
}
