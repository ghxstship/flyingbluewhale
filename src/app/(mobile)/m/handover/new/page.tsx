"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { submitHandover } from "../actions";

/**
 * COMPVSS · New Handover — client wrapper over the kit `handover` FormScreen.
 * Serialises kit values → FormData → `submitHandover` action, routes back.
 */
export default function NewHandoverPage() {
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
      const res = await submitHandover(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/m/handover");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>{error}</div>}
      <FormScreen formId="handover" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
