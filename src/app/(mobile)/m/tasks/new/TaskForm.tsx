"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, FORMS, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { createFieldTask } from "./actions";

/**
 * COMPVSS · New Task — client leaf.
 *
 * Kit 31 (live-test resolution #14): the construction-grade form. The def is
 * the kit `task` spec with the cost-code and company selects injected from
 * the REAL stores (cost_centers, vendors) by the server page — the kit's
 * static seed codes would be fabrication.
 */
export function TaskForm({
  costCodeOptions,
  companyOptions,
}: {
  costCodeOptions: string[];
  companyOptions: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const base = FORMS.task!;
  const def: FormDef = {
    ...base,
    fields: base.fields.map((f) =>
      f.id === "costCode"
        ? { ...f, options: costCodeOptions }
        : f.id === "company"
          ? { ...f, options: companyOptions }
          : f,
    ),
  };

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await createFieldTask(null, fd);
      // A successful create redirects server-side, so reaching here with a
      // result means it failed.
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <FormScreen def={def} onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
