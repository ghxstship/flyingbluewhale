"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { quickFileIncident, type State } from "./actions";

/**
 * Express one-field incident filing. Deliberately NOT FormShell — the
 * express UX is a single autofocused textarea + one full-width button.
 * useActionState keeps failures inline (with the typed summary echoed
 * back) instead of crashing to the route error boundary.
 */
export function QuickFileForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(quickFileIncident, null);
  return (
    <form action={formAction} className="mt-5 space-y-3">
      <label className="block text-xs font-semibold">
        {t("m.incident.new.summaryLabel", undefined, "What happened?")}
        <textarea
          name="summary"
          required
          rows={5}
          minLength={5}
          maxLength={500}
          autoFocus
          defaultValue={state?.values?.summary}
          placeholder={t(
            "m.incident.new.summaryPlaceholder",
            undefined,
            "e.g. Cable trip hazard near stage left exit — flagged with cone.",
          )}
          className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-3 text-base"
        />
      </label>
      {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
      <button type="submit" disabled={pending} className="ps-btn w-full">
        {pending
          ? t("m.incident.new.filing", undefined, "Filing…")
          : t("m.incident.new.fileNow", undefined, "File Now")}
      </button>
    </form>
  );
}
