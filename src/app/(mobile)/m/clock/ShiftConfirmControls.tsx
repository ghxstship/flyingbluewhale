"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Quick-confirm widget for upcoming shifts — Connecteam parity.
 * Shown for scheduled shifts that haven't been clock-in'd yet.
 * The worker taps once to confirm attendance without leaving the list.
 * If they can't make it, the "Can't make it" link goes to the swap page.
 */
export function ShiftConfirmControls({
  shiftId,
  confirmedAt,
}: {
  shiftId: string;
  confirmedAt: string | null;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const t = useT();

  if (confirmedAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--p-success)]">
        <CheckCircle size={13} aria-hidden="true" />
        {t("m.clock.shiftConfirmed", undefined, "Attendance confirmed")}
      </div>
    );
  }

  const confirm = () => {
    start(async () => {
      try {
        const res = await fetch("/api/v1/shifts/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ shiftId }),
        });
        const json = (await res.json()) as { ok: boolean; error?: { message: string } };
        if (!json.ok) {
          toast.error(json.error?.message ?? t("m.clock.error.couldntConfirm", undefined, "Couldn't confirm"));
          return;
        }
        toast.success(t("m.clock.toast.shiftConfirmed", undefined, "Attendance confirmed"));
        router.refresh();
      } catch {
        toast.error(t("m.clock.error.network", undefined, "Network error"));
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className="ps-btn ps-btn--sm ps-btn--ghost flex items-center gap-1.5"
      >
        <CheckCircle size={13} aria-hidden="true" />
        {pending
          ? t("m.clock.confirming", undefined, "Confirming…")
          : t("m.clock.confirmAttendance", undefined, "Confirm attendance")}
      </button>
      <a
        href={`/m/shift/swap`}
        className="text-xs text-[var(--p-text-2)] underline underline-offset-2 hover:text-[var(--p-text-1)]"
      >
        {t("m.clock.cantMakeIt", undefined, "Can't make it")}
      </a>
    </div>
  );
}
