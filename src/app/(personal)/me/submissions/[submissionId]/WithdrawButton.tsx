"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { withdrawSubmissionAction, type State } from "./actions";

/** Confirm-once withdraw control for the submitter's own submission. */
export function WithdrawButton({ submissionId, labels }: {
  submissionId: string;
  labels: { withdraw: string; confirm: string; done: string };
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(withdrawSubmissionAction, null);

  if (state?.ok) return <p className="text-sm text-[var(--p-text-2)]">{labels.done}</p>;
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(labels.confirm)) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="submission_id" value={submissionId} />
      {state?.error ? <p className="text-sm text-[var(--p-danger-text)]">{state.error}</p> : null}
      <Button type="submit" variant="ghost" disabled={pending}>
        {labels.withdraw}
      </Button>
    </form>
  );
}
