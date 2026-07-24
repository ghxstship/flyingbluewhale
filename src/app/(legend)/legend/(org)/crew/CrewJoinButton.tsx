"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useActionErrorResolver } from "@/lib/errors-client";
import { joinCrewAction, leaveCrewAction, type State } from "./actions";

/**
 * Per-crew join / leave control (PERSONA_MATRIX S-2). `member` picks which
 * action the form posts to. Denials (read-only personas, RLS) surface inline.
 */
export function CrewJoinButton({ crewId, member }: { crewId: string; member: boolean }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    member ? leaveCrewAction : joinCrewAction,
    null,
  );
  const t = useT();
  const resolveErr = useActionErrorResolver();
  return (
    <form action={formAction} className="flex shrink-0 flex-col items-end gap-1">
      <input type="hidden" name="crew_id" value={crewId} />
      <button
        type="submit"
        disabled={pending}
        className={`ps-btn ps-btn--sm ${member ? "ps-btn--secondary" : "ps-btn--primary"}`}
      >
        {pending
          ? "…"
          : member
            ? t("console.legend.crew.leave", undefined, "Leave")
            : t("console.legend.crew.join", undefined, "Join")}
      </button>
      {state?.error && (
        <span className="text-xs text-[var(--p-danger)]" role="alert">
          {resolveErr(state.error)}
        </span>
      )}
    </form>
  );
}
