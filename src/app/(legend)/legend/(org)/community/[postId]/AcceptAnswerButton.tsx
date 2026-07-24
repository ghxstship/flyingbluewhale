"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
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
      {accepted
        ? t("console.legend.community.post.accepted", undefined, "Accepted")
        : t("console.legend.community.post.acceptAnswer", undefined, "Accept Answer")}
    </button>
  );
}
