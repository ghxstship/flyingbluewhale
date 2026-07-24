"use client";

import { useActionState, useRef } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { addCommentAction, type State } from "../actions";
import { resolveActionError } from "@/lib/errors";

/** Answer/comment composer for a community post (kit 21 R2). */
export function CommentComposer({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState<State, FormData>(addCommentAction, null);
  const ref = useRef<HTMLFormElement>(null);
  const t = useT();
  return (
    <form
      ref={ref}
      action={(fd) => {
        formAction(fd);
        ref.current?.reset();
      }}
      className="surface p-4"
    >
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body_html"
        rows={3}
        required
        placeholder={t("console.legend.community.comment.placeholder", undefined, "Write an answer…")}
        className="ps-input w-full resize-y"
        aria-label={t("console.legend.community.comment.aria", undefined, "Your answer")}
      />
      {state?.error && (
        <p role="alert" className="mt-1 text-xs text-[var(--p-danger-text)]">
          {resolveActionError(state.error, t)}
        </p>
      )}
      <div className="mt-2 flex justify-end">
        <button type="submit" className="ps-btn ps-btn--sm" disabled={pending}>
          {pending
            ? t("console.legend.community.comment.posting", undefined, "Posting…")
            : t("console.legend.community.comment.submit", undefined, "Post Answer")}
        </button>
      </div>
    </form>
  );
}
