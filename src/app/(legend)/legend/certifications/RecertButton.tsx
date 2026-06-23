"use client";

import { useActionState } from "react";
import { requestRecertAction, type State } from "./actions";

/**
 * Inline "request recert" control for a certification holding. Posts the
 * holder id to the server action; renders the resulting confirmation/error.
 */
export function RecertButton({ holderId, label }: { holderId: string; label: string }) {
  const [state, action, pending] = useActionState<State, FormData>(requestRecertAction, null);
  if (state?.ok) {
    return <span className="text-xs font-medium text-[var(--p-success)]">Recert requested</span>;
  }
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="holder_id" value={holderId} />
      <button type="submit" disabled={pending} className="ps-btn ps-btn--secondary ps-btn--sm" style={{ minHeight: 44 }}>
        {pending ? "…" : label}
      </button>
      {state?.error && <span className="text-xs text-[var(--p-danger)]">{state.error}</span>}
    </form>
  );
}
