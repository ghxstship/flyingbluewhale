"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormScreen, KIcon, type FormDef } from "@/components/mobile/kit";
import { toFormData } from "@/lib/mobile/form-data";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createScheduleEvent } from "./actions";

/**
 * Schedule Event FAB — kit CREATE map `schedule`. Opens the kit `event`
 * FormScreen. Rendered only for the manager band (the page gates the mount;
 * the action re-checks server-side, and the events INSERT RLS agrees).
 */
export function ScheduleFab() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await createScheduleEvent(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="fab"
        aria-label={t("m.schedule.newEvent", undefined, "Schedule Event")}
        onClick={() => setOpen(true)}
      >
        <KIcon name="Plus" size={24} />
      </button>
      {open && (
        <>
          {/* FormScreen is its own fixed z-30 overlay — the error must float
              ABOVE it or a failed submit reads as a dead button. */}
          {error && (
            <div
              className="ps-alert ps-alert--danger"
              role="alert"
              style={{ position: "fixed", top: 12, left: 18, right: 18, zIndex: 46 }}
            >
              {error}
            </div>
          )}
          <FormScreen formId="event" onClose={() => setOpen(false)} onSubmit={onSubmit} />
        </>
      )}
    </>
  );
}
