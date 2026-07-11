"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { SubmissionColumn } from "@/lib/advancing/submission-schemas";
import type { PortalState } from "./actions";

/**
 * One structured-row entry form for a packet section — the replacement for
 * the copy-a-locked-Sheet workflow. Columns come from the section's
 * submission schema; each submit appends one row (line-item adds/changes
 * are the normal case, not an error).
 */
export function SubmissionRowForm({
  columns,
  action,
}: {
  columns: SubmissionColumn[];
  action: (prev: PortalState, fd: FormData) => Promise<PortalState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const t = useT();

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <div className="grid gap-3 md:grid-cols-2">
        {columns.map((column) => (
          <label key={column.key} className="block text-sm">
            <span className="mb-1 block text-xs text-[var(--p-text-2)]">
              {column.label}
              {column.required ? " *" : ""}
            </span>
            {column.kind === "select" ? (
              <select name={column.key} className="ps-input ps-input--sm w-full" defaultValue="">
                <option value="">—</option>
                {(column.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={column.key}
                type={column.kind === "date" ? "date" : column.kind === "number" ? "number" : "text"}
                required={column.required}
                className="ps-input ps-input--sm w-full"
              />
            )}
          </label>
        ))}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? t("p.advancing.rowSaving", undefined, "Saving…") : t("p.advancing.addRow", undefined, "Add Row")}
      </Button>
    </form>
  );
}
