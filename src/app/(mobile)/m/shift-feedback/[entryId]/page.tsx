"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitShiftFeedback } from "./actions";

const MOOD_LABELS = ["", "Rough", "Tough", "OK", "Good", "Great"];
const MOOD_EMOJI  = ["", "😩", "😕", "😐", "🙂", "😄"];

export default function ShiftFeedbackPage({ params }: { params: Promise<{ entryId: string }> }) {
  const router = useRouter();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [safety, setSafety] = useState(0);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Resolve params on first render
  if (!entryId) {
    params.then((p) => setEntryId(p.entryId));
    return null;
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-24 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-semibold">Thanks for the feedback!</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Your input helps improve every shift.</p>
        <button
          className="mt-6 px-6 py-2 rounded-lg bg-[var(--org-primary)] text-white text-sm font-medium"
          onClick={() => router.push("/m")}
        >
          Back to home
        </button>
      </div>
    );
  }

  function handleSubmit() {
    if (mood === 0) { setError("Please rate your mood."); return; }
    setError(null);
    startTransition(async () => {
      const res = await submitShiftFeedback({ entryId: entryId!, mood, energy: energy || undefined, safetyRating: safety || undefined, comment: comment.trim() || undefined, anonymous });
      if (res?.error) { setError(res.error); return; }
      setSubmitted(true);
    });
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Shift Pulse</div>
      <h1 className="mt-1 text-2xl font-semibold">How was your shift?</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">30 seconds. Anonymous optional.</p>

      {/* Mood */}
      <div className="mt-6">
        <p className="text-sm font-medium mb-3">Overall mood</p>
        <div className="flex gap-2 justify-between">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setMood(v)}
              className={`flex-1 py-3 rounded-xl text-2xl transition-all ${mood === v ? "ring-2 ring-[var(--org-primary)] bg-[var(--surface-raised)]" : "bg-[var(--surface)]"}`}
              aria-label={MOOD_LABELS[v]}
            >
              {MOOD_EMOJI[v]}
            </button>
          ))}
        </div>
        {mood > 0 && <p className="mt-2 text-center text-sm text-[var(--text-muted)]">{MOOD_LABELS[mood]}</p>}
      </div>

      {/* Energy */}
      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Energy level <span className="text-[var(--text-muted)] font-normal">(optional)</span></p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setEnergy(energy === v ? 0 : v)}
              className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${v <= energy ? "bg-[var(--org-primary)] text-white" : "bg-[var(--surface-raised)] text-[var(--text-muted)]"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Safety */}
      <div className="mt-5">
        <p className="text-sm font-medium mb-2">Safety conditions <span className="text-[var(--text-muted)] font-normal">(optional)</span></p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              onClick={() => setSafety(safety === v ? 0 : v)}
              className={`flex-1 h-8 rounded-md text-xs font-medium transition-all ${v <= safety ? "bg-[var(--org-primary)] text-white" : "bg-[var(--surface-raised)] text-[var(--text-muted)]"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mt-5">
        <p className="text-sm font-medium mb-2">Anything to share? <span className="text-[var(--text-muted)] font-normal">(optional)</span></p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What went well? What could improve?"
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-[var(--surface-raised)] text-sm resize-none border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
          maxLength={500}
        />
      </div>

      {/* Anonymous toggle */}
      <div className="mt-4 flex items-center gap-3">
        <button
          role="switch"
          aria-checked={anonymous}
          onClick={() => setAnonymous(!anonymous)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${anonymous ? "bg-[var(--org-primary)]" : "bg-[var(--surface-raised)]"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${anonymous ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className="text-sm text-[var(--text-muted)]">Submit anonymously</span>
      </div>

      {error && <p className="mt-3 text-sm text-[color:var(--color-error)]">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={pending || mood === 0}
        className="mt-6 w-full py-3 rounded-xl bg-[var(--org-primary)] text-white font-medium disabled:opacity-40 transition-opacity"
      >
        {pending ? "Submitting…" : "Submit feedback"}
      </button>

      <button onClick={() => router.back()} className="mt-3 w-full py-2 text-sm text-[var(--text-muted)]">
        Skip
      </button>
    </div>
  );
}
