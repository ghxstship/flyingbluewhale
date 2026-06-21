"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormScreen, KIcon } from "@/components/mobile/kit";
import type { FormDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { addShiftNote } from "./actions";

/**
 * Shift-note composer — the kit `shiftnote` FormScreen wired to the
 * `addShiftNote` server action. Opens in a sheet from the time-entry
 * history; targets a specific time entry.
 */
export function ShiftNoteForm({ entryId, entryLabel }: { entryId: string; entryLabel: string }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (_def: FormDef, vals: Record<string, unknown>) => {
    if (pending) return;
    setError(null);
    const note = String(vals.note ?? "");
    const asManager = String(vals.author ?? "You") === "As Manager";
    startTransition(async () => {
      const res = await addShiftNote(entryId, note, asManager);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button type="button" className="ps-btn ps-btn--sm" onClick={() => setOpen(true)}>
        <KIcon name="StickyNote" size={14} /> {t("m.clock.addNote", undefined, "Add Note")}
      </button>
    );
  }

  return (
    <div>
      <div className="hint" style={{ marginBottom: 6 }}>{entryLabel}</div>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <FormScreen formId="shiftnote" onClose={() => setOpen(false)} onSubmit={submit} />
    </div>
  );
}
