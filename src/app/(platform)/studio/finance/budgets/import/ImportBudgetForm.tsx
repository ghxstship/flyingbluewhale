"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/Button";
import { importBudgetCsv, type State } from "./actions";
import { useActionErrorResolver } from "@/lib/errors-client";
import { useT } from "@/lib/i18n/LocaleProvider";

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
  const t = useT();
  const [state, action] = useFormState(importBudgetCsv, null as State);
  const resolveErr = useActionErrorResolver();
  return (
    <form action={action} className="space-y-4">
      <div className="surface p-4">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("console.finance.budgets.import.paste", undefined, "Paste")}
        </h2>
        <p className="mt-2 text-xs text-[var(--p-text-2)]">
          {t(
            "console.finance.budgets.import.instructions",
            undefined,
            "Copy the Budget sheet header row plus data rows from the XPMS template and paste below. PROJECT accepts either a project name or a UUID. ESTIMATE and VARIANCE are skipped (the database recomputes them). FLAG accepts true/false, yes/no, or 1/0.",
          )}
        </p>
        <textarea
          name="csv"
          required
          rows={14}
          className="ps-input mt-3 w-full font-mono text-xs"
          placeholder={`${TEMPLATE_HEADER}\n…\n`}
        />
      </div>

      {state && "error" in state && state.error && (
        <div className="surface border-[var(--p-danger)]/20 p-3 text-sm text-[var(--p-danger)]">{resolveErr(state.error)}</div>
      )}
      {state && "ok" in state && state.ok && (
        <div className="surface p-3 text-sm">
          <div className="font-semibold">
            {t("console.finance.budgets.import.inserted", { count: state.inserted }, `Inserted ${state.inserted} row(s).`)}
          </div>
          {state.skipped.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">
                {t(
                  "console.finance.budgets.import.skipped",
                  { count: state.skipped.length },
                  `Skipped ${state.skipped.length} row(s)`,
                )}
              </summary>
              <ul className="mt-1 space-y-0.5">
                {state.skipped.map((s, i) => (
                  <li key={i}>
                    {t(
                      "console.finance.budgets.import.skippedRow",
                      { row: s.row, reason: s.reason },
                      `Row ${s.row}: ${s.reason}`,
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button href="/studio/finance/budgets" variant="secondary">
          {t("console.finance.budgets.import.cancel", undefined, "Cancel")}
        </Button>
        <Button type="submit">{t("console.finance.budgets.import.submit", undefined, "Import Rows")}</Button>
      </div>
    </form>
  );
}
