"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { TIMESHEET_DECISION_LABEL, type TimesheetDecision } from "@/lib/db/timesheets";
import { decideTimesheet, type State } from "./actions";

/**
 * Manager-only approval state-machine control. Renders one decision per
 * allowed transition for the timesheet's current state; submitting writes a
 * `timesheet_approvals` row and advances `timesheets.state` server-side.
 */
export function ApprovalControl({
  timesheetId,
  decisions,
}: {
  timesheetId: string;
  decisions: readonly TimesheetDecision[];
}) {
  const t = useT();
  const action = decideTimesheet.bind(null, timesheetId);
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  if (decisions.length === 0) {
    return (
      <p className="text-sm text-[var(--p-text-2)]">
        {t("console.finance.timesheets.review.locked", undefined, "This timesheet is in a state with no pending review.")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="decision" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.finance.timesheets.review.decisionLabel", undefined, "Decision")}
        </label>
        <select id="decision" name="decision" defaultValue={decisions[0]} className="ps-input mt-1.5 w-full" required>
          {decisions.map((d) => (
            <option key={d} value={d}>
              {TIMESHEET_DECISION_LABEL[d]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.finance.timesheets.review.notesLabel", undefined, "Notes (optional)")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="ps-input mt-1.5 w-full"
          placeholder={t("console.finance.timesheets.review.notesPlaceholder", undefined, "Reason or context…")}
        />
      </div>
      {state && "error" in state && state.error && <Alert kind="error">{state.error}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {t("console.finance.timesheets.review.submit", undefined, "Record decision")}
        </Button>
      </div>
    </form>
  );
}
