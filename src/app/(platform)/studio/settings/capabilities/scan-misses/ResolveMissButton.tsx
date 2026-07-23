"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { resolveScanMiss, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
/** One-click "handled" for a miss row; errors surface inline beside it. */
export function ResolveMissButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(resolveScanMiss, null);
  const resolveErr = useActionErrorResolver();
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state?.error && (
        <span className="text-xs text-[var(--p-danger-text)]" role="alert">
          {resolveErr(state.error)}
        </span>
      )}
      <Button type="submit" size="sm" variant="tertiary" disabled={pending}>
        {pending ? "Resolving…" : "Resolve"}
      </Button>
    </form>
  );
}
