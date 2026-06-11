"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PULSE_SCORE_EMOJI, PULSE_SCORE_LABELS, type PulseScore } from "@/lib/connecteam";

interface Props {
  shiftId: string;
  onDone: () => void;
}

export function ShiftPulseModal({ shiftId, onDone }: Props) {
  const [selected, setSelected] = useState<PulseScore | null>(null);
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();

  const submit = () => {
    if (!selected) return;
    start(async () => {
      const res = await fetch("/api/v1/shifts/pulse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shiftId, score: selected, comment: comment.trim() || undefined }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: { message: string } };
      if (!json.ok) {
        toast.error(json.error?.message ?? "Couldn't save pulse");
      } else {
        toast.success("Shift pulse saved — thanks!");
        onDone();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 px-0 pb-0" onClick={onDone}>
      <div
        className="surface w-full rounded-t-2xl p-6 pb-safe-or-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">How was your shift?</h2>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">Your feedback is anonymous to other crew.</p>

        {/* Emoji score row */}
        <div className="mt-5 flex justify-between gap-2">
          {([1, 2, 3, 4, 5] as PulseScore[]).map((s) => (
            <button
              key={s}
              type="button"
              className={[
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition-all",
                selected === s
                  ? "bg-[var(--p-accent)] text-white scale-105"
                  : "surface-raised hover:scale-105",
              ].join(" ")}
              onClick={() => setSelected(s)}
            >
              <span className="text-2xl">{PULSE_SCORE_EMOJI[s]}</span>
              <span>{PULSE_SCORE_LABELS[s]}</span>
            </button>
          ))}
        </div>

        {/* Optional comment */}
        {selected && (
          <div className="mt-4">
            <textarea
              className="surface-inset w-full resize-none rounded-lg p-3 text-sm outline-none placeholder:text-[var(--p-text-3)] focus:ring-2 focus:ring-[var(--p-accent)]"
              rows={2}
              maxLength={500}
              placeholder="Anything specific? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="ps-btn ps-btn--ghost"
            onClick={onDone}
            disabled={pending}
          >
            Skip
          </button>
          <button
            type="button"
            className="ps-btn"
            disabled={!selected || pending}
            onClick={submit}
          >
            {pending ? "Saving…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
