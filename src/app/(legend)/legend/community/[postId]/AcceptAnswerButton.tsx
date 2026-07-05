"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { acceptAnswerAction } from "../actions";

/** Accept / un-accept an answer — visible only to the question's author (kit 21 R2). */
export function AcceptAnswerButton({
  postId,
  commentId,
  accepted,
}: {
  postId: string;
  commentId: string;
  accepted: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        React.startTransition(async () => {
          await acceptAnswerAction(postId, commentId);
          setBusy(false);
        });
      }}
      className={`ps-btn ps-btn--sm ${accepted ? "ps-btn--secondary" : "ps-btn--cta"}`}
    >
      <Check size={13} className="me-1" aria-hidden="true" />
      {accepted ? "Accepted" : "Accept Answer"}
    </button>
  );
}
