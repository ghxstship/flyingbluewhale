"use client";

import { useState, useTransition } from "react";
import { submitShiftPulse } from "./actions";

const MOODS = [
  { value: 1, emoji: "😩", label: "Rough" },
  { value: 2, emoji: "😟", label: "Hard" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
];

/**
 * Post-shift feedback form (Shift Pulse — Deputy parity, 2025).
 * Shown after a successful clock-out. Collects a 1–5 mood rating,
 * optional highlights, and optional blockers for manager visibility.
 * Skippable — closing dismisses without writing a row.
 */
export function ShiftPulseForm({
  entryId,
  onDone,
}: {
  entryId: string;
  onDone: () => void;
}) {
  const [mood, setMood] = useState<number | null>(null);
  const [highlights, setHighlights] = useState("");
  const [blockers, setBlockers] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = () => {
    if (mood === null || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await submitShiftPulse(entryId, mood, highlights, blockers);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      setTimeout(onDone, 1200);
    });
  };

  if (done) {
    return (
      <div className="surface rounded-xl p-4 text-center" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 28 }}>✅</div>
        <div className="text-sm font-medium mt-1">Thanks for the feedback!</div>
      </div>
    );
  }

  return (
    <div className="surface rounded-xl p-4 space-y-4" style={{ marginTop: 16 }}>
      <div>
        <div className="text-[10px] font-mono text-[var(--p-text-3)] uppercase tracking-wider mb-2">
          Shift Pulse
        </div>
        <div className="text-sm font-medium">How was your shift?</div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMood(m.value)}
            disabled={pending}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "8px 4px",
              borderRadius: 10,
              border: `2px solid ${mood === m.value ? "var(--p-accent)" : "var(--p-border)"}`,
              background: mood === m.value ? "var(--p-accent-50)" : "transparent",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
            aria-label={m.label}
            aria-pressed={mood === m.value}
          >
            {m.emoji}
            <span style={{ fontSize: 9, color: "var(--p-text-3)" }}>{m.label}</span>
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          Highlights <span className="text-[var(--p-text-3)]">(optional)</span>
        </label>
        <textarea
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="What went well?"
          className="ps-input mt-1.5 w-full text-sm"
          disabled={pending}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          Blockers <span className="text-[var(--p-text-3)]">(optional)</span>
        </label>
        <textarea
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Any issues for the team to know?"
          className="ps-input mt-1.5 w-full text-sm"
          disabled={pending}
        />
      </div>

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert">
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="ps-btn ps-btn--cta"
          style={{ flex: 1 }}
          disabled={mood === null || pending}
          onClick={submit}
        >
          {pending ? "Submitting…" : "Submit Pulse"}
        </button>
        <button type="button" className="ps-btn" disabled={pending} onClick={onDone}>
          Skip
        </button>
      </div>
    </div>
  );
}
