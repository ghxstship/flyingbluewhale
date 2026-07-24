"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { submitReviewAction, type State } from "./review-actions";
import { resolveActionError } from "@/lib/errors";

/**
 * Course review form. Pre-fills the learner's existing review (if any) so the
 * submit doubles as an edit. Posts rating + body to the server action.
 */
export function ReviewForm({
  courseId,
  initialRating,
  initialBody,
}: {
  courseId: string;
  initialRating?: number;
  initialBody?: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(submitReviewAction, null);
  const t = useT();
  return (
    <form action={action} className="surface flex flex-col gap-2 p-4">
      <input type="hidden" name="course_id" value={courseId} />
      <label htmlFor="review-rating" className="text-sm font-semibold text-[var(--p-text-1)]">
        {initialRating
          ? t("console.legend.learn.review.updateTitle", undefined, "Update your review")
          : t("console.legend.learn.review.leaveTitle", undefined, "Leave a review")}
      </label>
      <div className="flex items-center gap-2">
        <select id="review-rating" name="rating" defaultValue={initialRating ?? ""} required className="ps-input" style={{ minHeight: 40 }}>
          <option value="" disabled>
            {t("console.legend.learn.review.ratingPlaceholder", undefined, "Rating…")}
          </option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="body"
        defaultValue={initialBody ?? ""}
        placeholder={t("console.legend.learn.review.bodyPlaceholder", undefined, "What worked? What would you change?")}
        rows={3}
        maxLength={2000}
        className="ps-input"
      />
      <div>
        <button type="submit" disabled={pending} className="ps-btn ps-btn--primary" style={{ minHeight: 40 }}>
          {pending
            ? "…"
            : initialRating
              ? t("console.legend.learn.review.updateSubmit", undefined, "Update review")
              : t("console.legend.learn.review.postSubmit", undefined, "Post review")}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {resolveActionError(state.error, t)}
        </p>
      )}
      {state?.ok && <p className="text-xs text-[var(--p-success)]">{state.ok}</p>}
    </form>
  );
}
