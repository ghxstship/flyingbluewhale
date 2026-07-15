"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { fileLostFound } from "./actions";

/**
 * COMPVSS · Lost & Found — thin client wrapper around the kit `lostfound`
 * FormScreen. The form spec had existed since the kit rebuild but was
 * mounted nowhere, so the only way to report property from the field was
 * the safety incident intake — which is what put every dropped backpack in
 * the safety queue and every injury in Lost & Found.
 */
export default function LostFoundPage() {
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
      const res = await fileLostFound(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/m/more");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      {error && (
        <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <FormScreen formId="lostfound" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
