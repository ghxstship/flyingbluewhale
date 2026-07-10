"use client";

import * as React from "react";
import { toast } from "@/lib/hooks/useToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useT } from "@/lib/i18n/LocaleProvider";
import { deleteAvailabilityAction } from "./actions";

/**
 * Confirmed slot removal (AUDIT C-23) — single-click deletes on calendar
 * data are unforgiving, so removal now restates what is being removed and
 * asks first. Errors surface as a toast instead of vanishing.
 */
export function RemoveSlotButton({ slotId, summary }: { slotId: string; summary: string }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button type="button" className="ps-btn ps-btn--ghost text-xs" onClick={() => setOpen(true)}>
        {t("common.remove", undefined, "Remove")}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="danger"
        title={t("me.availability.remove.title", undefined, "Remove this slot?")}
        description={t(
          "me.availability.remove.description",
          { summary },
          `${summary} will be removed from your calendar. Booking checks will no longer see it.`,
        )}
        confirmLabel={t("common.remove", undefined, "Remove")}
        onConfirm={async () => {
          const fd = new FormData();
          fd.set("slot_id", slotId);
          const res = await deleteAvailabilityAction(null, fd);
          if (res?.error) toast.error(res.error);
        }}
      />
    </>
  );
}
