"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { requestTimeOff } from "../actions";

/**
 * COMPVSS · Request Time Off — client wrapper over the kit `timeoff`
 * FormScreen. Serialises kit values → FormData → `requestTimeOff` action.
 */
export default function NewTimeOffPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await requestTimeOff(null, fd);
      if (res?.error) {
        // Surface the per-field messages too — the generic banner alone
        // ("Please fix the errors below.") tells the crew member nothing
        // actionable (the kit FormScreen has no field-error slots).
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      router.push("/m/time-off");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && (
        <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
          <div>{error}</div>
          {Object.keys(fieldErrors).length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field} style={{ fontSize: 12 }}>
                  {message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <FormScreen formId="timeoff" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
