"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { createFieldTemplate } from "../actions";

/**
 * COMPVSS · New Template (kit 31, live-test resolution #15) — the kit
 * `template` FormScreen over `createFieldTemplate`. Manager-band write; the
 * action re-checks server-side (this page just renders the form for anyone
 * who reached it).
 */
export default function NewTemplatePage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await createFieldTemplate(null, fd);
      if (res?.error) {
        setError(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      router.push("/m/templates");
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
      <FormScreen formId="template" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
