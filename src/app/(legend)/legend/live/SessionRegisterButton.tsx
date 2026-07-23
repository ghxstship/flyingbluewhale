"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { registerForSessionAction, cancelRegistrationAction, type State } from "./actions";

/**
 * Per-session register / cancel control. Shows the live registration outcome.
 * `registered` controls which action the button posts to.
 */
export function SessionRegisterButton({
  sessionId,
  registered,
}: {
  sessionId: string;
  registered: boolean;
}) {
  const action = registered ? cancelRegistrationAction : registerForSessionAction;
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);
  const t = useT();
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="session_id" value={sessionId} />
      <button
        type="submit"
        disabled={pending}
        className={`ps-btn ${registered ? "ps-btn--secondary" : "ps-btn--primary"}`}
        style={{ minHeight: 36 }}
      >
        {pending
          ? "…"
          : registered
            ? t("console.legend.live.cancel", undefined, "Cancel")
            : t("console.legend.live.register", undefined, "Register")}
      </button>
      {state?.error && (
        <span className="text-xs text-[var(--p-danger)]" role="alert">
          {state.error}
        </span>
      )}
      {state?.ok && <span className="text-xs text-[var(--p-success)]">{state.ok}</span>}
    </form>
  );
}
