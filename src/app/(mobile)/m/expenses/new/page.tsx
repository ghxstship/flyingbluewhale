"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { fileExpense } from "../actions";

/**
 * COMPVSS · File Expense — the kit `expense` FormScreen, finally mounted.
 *
 * The spec had existed since the kit rebuild and was in
 * UNMOUNTED_PHOTO_SPECS: written, complete, reachable from nowhere. G1 in
 * the parity audit and the joint highest-impact gap in the register — the
 * device with the camera could not file the expense the camera is for.
 */
export default function NewExpensePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      <FormScreen formId="expense" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
