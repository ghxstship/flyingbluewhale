"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
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
    const fd = new FormData();
    for (const [k, val] of Object.entries(vals)) {
      if (val == null) continue;
      fd.set(k, typeof val === "boolean" ? (val ? "1" : "") : String(val));
    }
    startTransition(async () => {
      const res = await fileIncident(null, fd);
      if (res?.error) {
        setError(res.error);
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
