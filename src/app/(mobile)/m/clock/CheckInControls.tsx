"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";

type Action = "check_in" | "check_out" | "break_start" | "break_end";
type Step = "idle" | "pulse";

const PULSE_OPTIONS = [
  { rating: 1, emoji: "😞", label: "Rough" },
  { rating: 2, emoji: "😕", label: "Tough" },
  { rating: 3, emoji: "😐", label: "OK" },
  { rating: 4, emoji: "🙂", label: "Good" },
  { rating: 5, emoji: "😊", label: "Great" },
] as const;

function tryGetPosition(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  });
}

export function CheckInControls({
  shiftId,
  attendance,
}: {
  shiftId: string;
  attendance: "scheduled" | "checked_in" | "on_break" | "checked_out" | "no_show";
}) {
  const [step, setStep] = useState<Step>("idle");
  const [pulseRating, setPulseRating] = useState<number | null>(null);
  const [pulseNote, setPulseNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const t = useT();

  const punch = (
    action: Action,
    label: string,
    opts?: { pulse_rating?: number; pulse_note?: string },
  ) => {
    start(async () => {
      try {
        const needsGps = action === "check_in" || action === "check_out";
        const pos = needsGps ? await tryGetPosition() : null;
        const res = await fetch("/api/v1/shifts/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            shiftId,
            action,
            ...(pos ? { lat: pos.lat, lng: pos.lng } : {}),
            ...(opts?.pulse_rating != null ? { pulse_rating: opts.pulse_rating } : {}),
            ...(opts?.pulse_note ? { pulse_note: opts.pulse_note } : {}),
          }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          queued?: boolean;
          error?: { message: string };
        };
        if (!json.ok) {
          toast.error(json.error?.message ?? t("m.clock.error.couldntUpdate", undefined, "Couldn't update"));
          return;
        }
        if (json.queued) {
          toast.info(t("m.clock.toast.queued", { label }, `${label} (queued — will sync when online)`));
        } else {
          toast.success(label);
        }
        setStep("idle");
        setPulseRating(null);
        setPulseNote("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("m.clock.error.network", undefined, "Network error"));
      }
    });
  };

  const submitCheckOut = () =>
    punch("check_out", t("m.clock.toast.clockedOut", undefined, "Clocked out"), {
      pulse_rating: pulseRating ?? undefined,
      pulse_note: pulseNote.trim() || undefined,
    });

  if (attendance === "checked_out") {
    return <div className="text-xs text-[var(--p-text-2)]">{t("m.clock.shiftClosed", undefined, "Shift closed.")}</div>;
  }

  if (step === "pulse") {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[var(--p-text-2)] uppercase tracking-wide">
          {t("m.clock.pulse.prompt", undefined, "How was your shift?")}
        </p>
        <div className="flex gap-1.5">
          {PULSE_OPTIONS.map(({ rating, emoji, label }) => (
            <button
              key={rating}
              type="button"
              onClick={() => setPulseRating(rating === pulseRating ? null : rating)}
              aria-label={label}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2.5 text-xl transition-all ${
                pulseRating === rating
                  ? "bg-[var(--p-accent)] ring-2 ring-[var(--p-accent)] ring-offset-1"
                  : "bg-[var(--p-surface-raised)] hover:bg-[var(--p-border)]"
              }`}
            >
              {emoji}
              <span className="text-[9px] font-medium tracking-wide">{label}</span>
            </button>
          ))}
        </div>
        <textarea
          value={pulseNote}
          onChange={(e) => setPulseNote(e.target.value)}
          placeholder={t("m.clock.pulse.notePlaceholder", undefined, "Anything to flag? (optional)")}
          rows={2}
          maxLength={500}
          className="ps-input w-full resize-none text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="ps-btn ps-btn--ghost"
            disabled={pending}
            onClick={submitCheckOut}
          >
            {t("m.clock.pulse.skip", undefined, "Skip")}
          </button>
          <button
            type="button"
            className="ps-btn ps-btn--danger"
            disabled={pending || pulseRating == null}
            onClick={submitCheckOut}
          >
            {pending
              ? t("m.clock.working", undefined, "Working…")
              : t("m.clock.clockOut", undefined, "Clock out")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {attendance === "scheduled" && (
        <button
          type="button"
          className="ps-btn col-span-2"
          disabled={pending}
          onClick={() => punch("check_in", t("m.clock.toast.checkedIn", undefined, "Checked in"))}
        >
          {pending ? t("m.clock.working", undefined, "Working…") : t("m.clock.clockIn", undefined, "Clock in")}
        </button>
      )}
      {attendance === "checked_in" && (
        <>
          <button
            type="button"
            className="ps-btn ps-btn--ghost"
            disabled={pending}
            onClick={() => punch("break_start", t("m.clock.toast.breakStarted", undefined, "Break started"))}
          >
            {t("m.clock.startBreak", undefined, "Start break")}
          </button>
          <button
            type="button"
            className="ps-btn ps-btn--danger"
            disabled={pending}
            onClick={() => setStep("pulse")}
          >
            {t("m.clock.clockOut", undefined, "Clock out")}
          </button>
        </>
      )}
      {attendance === "on_break" && (
        <>
          <button
            type="button"
            className="ps-btn"
            disabled={pending}
            onClick={() => punch("break_end", t("m.clock.toast.backFromBreak", undefined, "Back from break"))}
          >
            {t("m.clock.endBreak", undefined, "End break")}
          </button>
          <button
            type="button"
            className="ps-btn ps-btn--danger"
            disabled={pending}
            onClick={() => setStep("pulse")}
          >
            {t("m.clock.clockOut", undefined, "Clock out")}
          </button>
        </>
      )}
    </div>
  );
}
