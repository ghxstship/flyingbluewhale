"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { toggleArticleVerified } from "./actions";

/**
 * Mark-Verified control (kit 21 W7) for the KB article header. Manager-gated
 * upstream; flips the article's verification stamp via the server action.
 */
export function VerifyButton({
  articleId,
  slug,
  verified,
  labels,
}: {
  articleId: string;
  slug: string;
  verified: boolean;
  labels: { verify: string; unverify: string };
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        React.startTransition(async () => {
          await toggleArticleVerified(articleId, slug, !verified);
          setBusy(false);
        });
      }}
      className={`ps-btn ps-btn--sm ${verified ? "ps-btn--secondary" : "ps-btn--cta"}`}
    >
      <BadgeCheck size={14} className="me-1.5" aria-hidden="true" />
      {verified ? labels.unverify : labels.verify}
    </button>
  );
}
