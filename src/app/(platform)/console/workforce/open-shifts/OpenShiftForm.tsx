"use client";

import { useActionState } from "react";
import { createOpenShift, type OpenShiftState } from "./actions";

export function OpenShiftForm() {
  const [state, action, pending] = useActionState<OpenShiftState, FormData>(createOpenShift, null);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Role *</label>
        <input name="role" type="text" required placeholder="e.g. Stage Manager" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Starts *</label>
        <input name="starts_at" type="datetime-local" required className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Ends *</label>
        <input name="ends_at" type="datetime-local" required className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Hourly Rate (USD)</label>
        <input name="hourly_rate" type="number" min="0" step="0.50" placeholder="0.00" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Max Claims</label>
        <input name="max_claims" type="number" min="1" defaultValue="1" className="input" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Description</label>
        <input name="description" type="text" placeholder="Optional context" className="input" />
      </div>
      <div className="col-span-full flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-xs">
          <input name="notify_crew" type="checkbox" defaultChecked className="h-4 w-4" />
          Notify crew by push notification
        </label>
        {state?.error && (
          <p className="text-xs text-[var(--color-error)]">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-xs text-[var(--color-success)]">Open shift posted.</p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary ml-auto">
          {pending ? "Posting…" : "Post Shift"}
        </button>
      </div>
    </form>
  );
}
