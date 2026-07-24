"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { withdrawApplicationAction, type State } from "./actions";

/** Confirm-once withdraw control for the applicant's own application. */
export function WithdrawButton({ applicationId, labels }: {
  applicationId: string;
  labels: { withdraw: string; confirm: string; done: string };
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(withdrawApplicationAction, null);

  if (state?.ok) return <p className="text-sm text-[var(--p-text-2)]">{labels.done}</p>;
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(labels.confirm)) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="application_id" value={applicationId} />
      {state?.error ? <p className="text-sm text-[var(--p-danger-text)]">{state.error}</p> : null}
      <Button type="submit" variant="ghost" disabled={pending}>
        {labels.withdraw}
      </Button>
    </form>
  );
}
