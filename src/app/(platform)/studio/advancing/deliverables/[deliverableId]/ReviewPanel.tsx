"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, X, Clock, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { assignReviewer, removeReviewer, submitVerdict, type ReviewState } from "./actions";

export type Reviewer = {
  reviewerId: string;
  name: string;
  reviewState: "pending" | "approved" | "changes_requested";
};
export type PersonOpt = { id: string; label: string };

const STATE_BADGE: Record<Reviewer["reviewState"], { label: string; variant: "success" | "warning" | "muted" }> = {
  approved: { label: "Approved", variant: "success" },
  changes_requested: { label: "Changes Requested", variant: "warning" },
  pending: { label: "Pending", variant: "muted" },
};

/**
 * Deliverable review roster (kit 21 W2). Managers assign reviewers from the
 * people directory; each reviewer approves or requests changes on their own
 * row. The "N of M approved" tally lives in the header (computed server-side).
 */
export function ReviewPanel({
  deliverableId,
  reviewers,
  people,
  canManage,
  currentUserId,
  labels,
}: {
  deliverableId: string;
  reviewers: Reviewer[];
  people: PersonOpt[];
  canManage: boolean;
  currentUserId: string;
  labels: {
    heading: string;
    addReviewer: string;
    pick: string;
    approve: string;
    requestChanges: string;
    reset: string;
    remove: string;
    empty: string;
  };
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(assignReviewer, null);
  const assignedIds = new Set(reviewers.map((r) => r.reviewerId));
  const available = people.filter((p) => !assignedIds.has(p.id));

  return (
    <section className="surface p-5">
      <h3 className="text-sm font-semibold">{labels.heading}</h3>

      {reviewers.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--p-text-2)]">{labels.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {reviewers.map((r) => {
            const badge = STATE_BADGE[r.reviewState];
            const isMe = r.reviewerId === currentUserId;
            return (
              <li
                key={r.reviewerId}
                className="flex items-center justify-between gap-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <CircleDot size={14} className="text-[var(--p-text-3)]" aria-hidden="true" />
                  <span className="text-sm">{r.name}</span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  {isMe && (
                    <>
                      <button
                        type="button"
                        aria-label={labels.approve}
                        onClick={() => React.startTransition(() => void submitVerdict(deliverableId, "approved"))}
                        className="ps-btn ps-btn--icon ps-btn--sm"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={labels.requestChanges}
                        onClick={() =>
                          React.startTransition(() => void submitVerdict(deliverableId, "changes_requested"))
                        }
                        className="ps-btn ps-btn--icon ps-btn--sm"
                      >
                        <Clock size={14} />
                      </button>
                    </>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      aria-label={labels.remove}
                      onClick={() => React.startTransition(() => void removeReviewer(deliverableId, r.reviewerId))}
                      className="ps-btn ps-btn--icon ps-btn--sm text-[var(--p-danger)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canManage && available.length > 0 && (
        <form action={formAction} className="mt-3 flex items-end gap-2">
          <input type="hidden" name="deliverableId" value={deliverableId} />
          <label className="flex-1 text-xs font-medium">
            <span className="mb-1 block">{labels.addReviewer}</span>
            <select name="reviewerId" defaultValue="" className="ps-input w-full" required>
              <option value="" disabled>
                {labels.pick}
              </option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="ps-btn ps-btn--sm" disabled={pending}>
            {labels.addReviewer}
          </button>
        </form>
      )}
      {state?.error && (
        <p role="alert" className="mt-2 text-xs text-[var(--p-danger-text)]">
          {state.error}
        </p>
      )}
    </section>
  );
}
