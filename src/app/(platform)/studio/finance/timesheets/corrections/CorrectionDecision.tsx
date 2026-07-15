"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideCorrection, type State } from "./actions";

/**
 * Approve or deny one worker's correction request.
 *
 * `selfRequested` disables the control for a manager looking at their own
 * request. The refusal is enforced three layers down (route, RLS, and the
 * `tec_no_self_approval` CHECK); this just means they see WHY rather than
 * pressing a button that always fails.
 */
export function CorrectionDecision({
  correctionId,
  selfRequested,
}: {
  correctionId: string;
  selfRequested: boolean;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(decideCorrection, null);

  if (selfRequested) {
    return (
      <p className="text-xs text-[var(--p-text-3)]">
        {t(
          "console.finance.corrections.ownRequest",
          undefined,
          "This is your own request. Another manager has to decide it.",
        )}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="correctionId" value={correctionId} />
      <textarea
        name="notes"
        rows={2}
        className="ps-input ps-input--sm w-full"
        placeholder={t("console.finance.corrections.notesPlaceholder", undefined, "Note back to them (optional)…")}
      />
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">{state.ok}</Alert>}
      <div className="flex gap-2">
        <Button type="submit" name="decision" value="approved" size="sm" loading={pending}>
          {t("console.finance.corrections.approve", undefined, "Approve and apply")}
        </Button>
        <Button type="submit" name="decision" value="denied" size="sm" variant="secondary" disabled={pending}>
          {t("console.finance.corrections.deny", undefined, "Deny")}
        </Button>
      </div>
    </form>
  );
}
