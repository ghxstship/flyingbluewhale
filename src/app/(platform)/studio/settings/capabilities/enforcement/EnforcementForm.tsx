"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { flipEnforcement, type State } from "./actions";

/**
 * The confirm form under the preview. The server action re-measures the loss
 * list at submit time regardless of what this form claims — the checkbox is
 * the operator's acknowledgement, not the source of truth.
 */
export function EnforcementForm({
  enabling,
  losers,
}: {
  /** true = flipping TO enforced; false = back to grandfathered. */
  enabling: boolean;
  /** How many people the preview says would lose access (enabling only). */
  losers: number;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(flipEnforcement, null);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert">
          {state.error}
        </div>
      )}
      <input type="hidden" name="enforced" value={enabling ? "1" : ""} />
      {enabling && losers > 0 && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="acknowledged" value="1" required className="mt-0.5" />
          <span>
            I understand that {losers === 1 ? "1 person" : `${losers} people`} listed above will lose scan access the
            moment this is enforced, and that restoring anyone means granting them a capability first.
          </span>
        </label>
      )}
      <Button type="submit" variant={enabling ? "cta" : "tertiary"} disabled={pending}>
        {pending
          ? "Applying…"
          : enabling
            ? losers > 0
              ? "Enforce grants anyway"
              : "Enforce grants"
            : "Back to grandfathered"}
      </Button>
    </form>
  );
}
