"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/Button";
import { importBudgetCsv, type State } from "./actions";

const TEMPLATE_HEADER = [
  "RECORD ID",
  "PROJECT",
  "EVENT",
  "LOCATION",
  "ACTIVATION",
  "DEPARTMENT",
  "TEAM",
  "CLASS",
  "ITEM",
  "DESCRIPTION",
  "DISCIPLINE",
  "PHASE",
  "TIER",
  "XYZ",
  "LINE TYPE",
  "QUANTITY",
  "RATE",
  "ESTIMATE",
  "BUDGET",
  "COMMITTED",
  "FORECAST",
  "ACTUAL",
  "VARIANCE",
  "VENDOR",
  "STATUS",
  "FLAG",
  "EXTERNAL NOTES",
  "INTERNAL NOTES",
].join("\t");

export function ImportBudgetForm() {
  const [state, action] = useFormState(importBudgetCsv, null as State);
  return (
    <form action={action} className="space-y-4">
      <div className="surface p-4">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Paste</h2>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Copy the Budget sheet header row plus data rows from the XPMS template and paste below. PROJECT accepts either
          a project name or a UUID. ESTIMATE and VARIANCE are skipped (the database recomputes them). FLAG accepts
          true/false, yes/no, or 1/0.
        </p>
        <textarea
          name="csv"
          required
          rows={14}
          className="mt-3 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] px-3 py-2 font-mono text-xs"
          placeholder={`${TEMPLATE_HEADER}\n…\n`}
        />
      </div>

      {state && "error" in state && state.error && (
        <div className="surface border-red-500/20 p-3 text-sm text-red-500">{state.error}</div>
      )}
      {state && "ok" in state && state.ok && (
        <div className="surface p-3 text-sm">
          <div className="font-semibold">Inserted {state.inserted} row(s).</div>
          {state.skipped.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">Skipped {state.skipped.length} row(s)</summary>
              <ul className="mt-1 space-y-0.5">
                {state.skipped.map((s, i) => (
                  <li key={i}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button href="/console/finance/budgets" variant="secondary">
          Cancel
        </Button>
        <Button type="submit">Import rows</Button>
      </div>
    </form>
  );
}
