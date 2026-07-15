"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { createFieldTask } from "./actions";

/**
 * COMPVSS · New Task.
 *
 * The field could complete tasks but never create one, so anything a crew
 * member spotted on site had to survive until someone reached a desk. The
 * kit `task` form spec existed the whole time and was mounted nowhere.
 */
export default function NewTaskPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      <FormScreen formId="task" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
