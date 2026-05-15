"use client";
export const dynamic = "force-dynamic";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ShiftPulsePage() {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const labels = ["Rough", "OK", "Good", "Great", "Excellent"];

  function submit() {
    if (!rating) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/v1/shift-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "Failed to submit — try again");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center px-6 pt-20 pb-24 text-center">
        <div className="text-5xl">🙌</div>
        <h1 className="mt-4 text-xl font-semibold">Thanks for the feedback!</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Your rating helps the team get better every shift.</p>
        <button onClick={() => router.push("/m/shift")} className="btn btn-primary mt-8">
          Back to Shift
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Shift Pulse</div>
      <h1 className="mt-1 text-2xl font-semibold">How was your shift?</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Anonymous rating — takes 10 seconds.</p>

      <div className="mt-8 flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} — ${labels[n - 1]}`}
            className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl border-2 text-2xl transition-all ${
              rating === n
                ? "border-[var(--org-primary)] bg-[var(--org-primary)]/10 scale-110"
                : "border-[var(--border-color)] hover:border-[var(--org-primary)]"
            }`}
          >
            {["😞", "😐", "🙂", "😊", "🤩"][n - 1]}
          </button>
        ))}
      </div>

      {rating && (
        <p className="mt-3 text-center text-sm font-medium text-[var(--text-secondary)]">
          {labels[rating - 1]}
        </p>
      )}

      <div className="mt-6">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Optional comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Anything specific to share with your manager?"
          className="input-base mt-1.5 w-full resize-none"
        />
      </div>

      {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}

      <button onClick={submit} disabled={!rating || isPending} className="btn btn-primary mt-6 w-full">
        {isPending ? "Submitting…" : "Submit Rating"}
      </button>

      <button onClick={() => router.push("/m/shift")} className="mt-3 w-full text-center text-xs text-[var(--text-muted)]">
        Skip
      </button>
    </div>
  );
}
