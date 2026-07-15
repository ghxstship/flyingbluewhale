"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { fileIncident } from "../actions";

/**
 * COMPVSS · File Incident — thin client wrapper around the kit `incident`
 * FormScreen. On submit it serialises the kit values into FormData and calls
 * the `fileIncident` server action, then routes back to the queue.
 */
export default function NewIncidentPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await fileIncident(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      if (res?.warning) {
        // Uploading some evidence failed. The report is filed — don't
        // navigate away silently as if everything landed.
        setError(res.warning);
        return;
      }
      router.push("/m/incidents");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>{error}</div>}
      <FormScreen formId="incident" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
