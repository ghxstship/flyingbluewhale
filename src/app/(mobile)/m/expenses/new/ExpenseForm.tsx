"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, FORMS, EXPENSE_AUTO_CODE, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { fileExpense } from "../actions";

/**
 * COMPVSS · File Expense — client leaf (kit `expense` FormScreen).
 *
 * Kit 32 (drawer canon v2.8): the kit expense form carries a Cost Code
 * select defaulting to auto-coding. The server page injects the org's REAL
 * cost centers (mirroring the PO form); past 8 codes the shared FormScreen
 * renders the field as the searchable action-drawer picker.
 */
export function ExpenseForm({ costCodeOptions }: { costCodeOptions: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const base = FORMS.expense!;
  const def: FormDef = {
    ...base,
    fields: base.fields.map((f) =>
      f.id === "code"
        ? { ...f, options: [EXPENSE_AUTO_CODE, ...costCodeOptions], default: EXPENSE_AUTO_CODE }
        : f,
    ),
  };

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await fileExpense(null, fd);
      if (res?.error) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      // A warning means the expense landed but the receipt didn't — say so
      // on the list rather than swallowing it, because the person still has
      // the receipt in their hand right now and can retry.
      router.push(res?.warning ? `/m/expenses?warn=${encodeURIComponent(res.warning)}` : "/m/expenses");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          <div>{error}</div>
          {Object.keys(fieldErrors).length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {Object.entries(fieldErrors).map(([k, m]) => (
                <li key={k} style={{ fontSize: 12 }}>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <FormScreen def={def} onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
