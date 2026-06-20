"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/LocaleProvider";

const MOOD_LABELS = ["", "Rough", "Tough", "OK", "Good", "Great"] as const;
const FATIGUE_LABELS = ["", "Exhausted", "Tired", "Moderate", "Fresh", "Energized"] as const;

const EMOJI: Record<number, string> = { 1: "😔", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };
const ENERGY_EMOJI: Record<number, string> = { 1: "🔋", 2: "😴", 3: "🌤", 4: "⚡", 5: "🚀" };

export function ShiftPulseCard({ shiftId }: { shiftId: string }) {
  const t = useT();
  const [mood, setMood] = useState<number | null>(null);
  const [fatigue, setFatigue] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, start] = useTransition();

  if (submitted) {
    return (
      <div className="surface mt-4 p-4 text-center text-sm text-[var(--p-text-2)]">
        <span className="text-xl">✅</span>
        <p className="mt-1 font-medium">
          {t("m.pulse.thanks", undefined, "Thanks — feedback recorded.")}
        </p>
      </div>
    );
  }

  const canSubmit = mood !== null && fatigue !== null && !pending;

  const submit = () => {
    if (!canSubmit) return;
    start(async () => {
      const res = await fetch("/api/v1/shifts/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shiftId, mood, fatigue, comment: comment || undefined }),
      });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        toast.error(json.error?.message ?? t("m.pulse.error", undefined, "Couldn't save feedback"));
        return;
      }
      setSubmitted(true);
    });
  };

  return (
    <div className="surface mt-4 p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-[var(--p-accent)]">
          {t("m.pulse.eyebrow", undefined, "Shift Pulse")}
        </p>
        <p className="mt-0.5 text-sm font-medium">
          {t("m.pulse.heading", undefined, "How was your shift?")}
        </p>
      </div>

      <fieldset>
        <legend className="text-xs text-[var(--p-text-2)] mb-2">
          {t("m.pulse.mood", undefined, "Mood")}
        </legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              aria-label={MOOD_LABELS[v]}
              onClick={() => setMood(v)}
              className={[
                "flex-1 rounded-lg py-2 text-lg transition-colors",
                mood === v
                  ? "bg-[var(--p-accent)] text-white"
                  : "bg-[var(--p-surface-raised)] hover:bg-[var(--p-border)]",
              ].join(" ")}
            >
              {EMOJI[v]}
            </button>
          ))}
        </div>
        {mood !== null && (
          <p className="mt-1 text-xs text-center text-[var(--p-text-2)]">{MOOD_LABELS[mood]}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-xs text-[var(--p-text-2)] mb-2">
          {t("m.pulse.energy", undefined, "Energy level")}
        </legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              aria-label={FATIGUE_LABELS[v]}
              onClick={() => setFatigue(v)}
              className={[
                "flex-1 rounded-lg py-2 text-lg transition-colors",
                fatigue === v
                  ? "bg-[var(--p-accent)] text-white"
                  : "bg-[var(--p-surface-raised)] hover:bg-[var(--p-border)]",
              ].join(" ")}
            >
              {ENERGY_EMOJI[v]}
            </button>
          ))}
        </div>
        {fatigue !== null && (
          <p className="mt-1 text-xs text-center text-[var(--p-text-2)]">{FATIGUE_LABELS[fatigue]}</p>
        )}
      </fieldset>

      <div>
        <label className="text-xs text-[var(--p-text-2)] block mb-1">
          {t("m.pulse.commentLabel", undefined, "Anything else? (optional)")}
        </label>
        <textarea
          className="ps-input w-full text-sm resize-none"
          rows={2}
          maxLength={500}
          placeholder={t("m.pulse.commentPlaceholder", undefined, "Notes for your supervisor…")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="ps-btn w-full"
        disabled={!canSubmit}
        onClick={submit}
      >
        {pending
          ? t("m.pulse.submitting", undefined, "Submitting…")
          : t("m.pulse.submit", undefined, "Submit feedback")}
      </button>
    </div>
  );
}
