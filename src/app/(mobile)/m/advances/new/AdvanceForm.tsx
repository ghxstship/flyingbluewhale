"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormScreen } from "@/components/mobile/kit";
import type { FormDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { requestAdvance } from "../actions";

/**
 * Client wrapper around the kit `advance` FormScreen. Collects the form
 * values, serializes to FormData and calls the `requestAdvance` server
 * action, then navigates back to the advances list on success.
 */
export function AdvanceForm() {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const close = () => router.push("/m/advances");

  const submit = (_def: FormDef, vals: Record<string, unknown>) => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    for (const [k, v] of Object.entries(vals)) {
      if (v != null) fd.set(k, String(v));
    }
    startTransition(async () => {
      const res = await requestAdvance(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/m/advances");
      router.refresh();
    });
  };

  return (
    <div className="screen screen-anim">
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <FormScreen formId="advance" onClose={close} onSubmit={submit} />
      {pending && (
        <p className="hint" style={{ marginTop: 8 }}>
          {t("m.advances.new.submitting", undefined, "Submitting…")}
        </p>
      )}
    </div>
  );
}
