"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { resolveActionError } from "@/lib/errors";
import type { State } from "./actions";

/**
 * A row of transition/move buttons posting to one bound server action.
 * Each button submits its `value` under `name` (default "next"); the
 * action validates the transition server-side (LDP maps + publish guards)
 * and any refusal renders inline — a stale tab can't write an illegal
 * jump, and the operator sees WHY.
 */
export function StateActions({
  action,
  options,
  name = "next",
  variant = "secondary",
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  options: Array<{ value: string; label: string }>;
  name?: string;
  variant?: "secondary" | "primary";
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  const t = useT();
  if (options.length === 0) return null;
  const btnClass = variant === "primary" ? "ps-btn ps-btn--sm" : "ps-btn ps-btn--soft ps-btn--sm";
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button key={o.value} type="submit" name={name} value={o.value} disabled={pending} className={btnClass}>
          {o.label}
        </button>
      ))}
      {state?.error && (
        <span className="text-xs text-[var(--p-danger)]" role="alert">
          {resolveActionError(state.error, t)}
        </span>
      )}
    </form>
  );
}
