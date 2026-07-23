"use client";

import { useActionState, useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createPostAction, type State } from "./actions";
import { POST_CATEGORIES, POST_CATEGORY_LABELS } from "@/lib/legend_community";
import { resolveActionError } from "@/lib/errors";

/**
 * Inline community post composer. Posts to the server action; clears on
 * success. Token-only styling, ≥44px controls.
 */
export function PostComposer() {
  const [state, action, pending] = useActionState<State, FormData>(createPostAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useT();

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="surface flex flex-col gap-3 p-4">
      <input
        name="title"
        required
        placeholder={t("console.legend.community.composer.titlePlaceholder", undefined, "Share a win, ask a question…")}
        className="ps-input"
        style={{ minHeight: 44 }}
      />
      <textarea
        name="body_html"
        placeholder={t("console.legend.community.composer.bodyPlaceholder", undefined, "Add detail (optional)")}
        className="ps-input"
        rows={3}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          name="category"
          className="ps-input ps-input--sm"
          defaultValue="general"
          aria-label={t("console.legend.community.composer.categoryAria", undefined, "Category")}
          style={{ minHeight: 44 }}
        >
          {POST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {POST_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="ps-btn ps-btn--cta" style={{ minHeight: 44 }}>
          {pending
            ? t("console.legend.community.composer.posting", undefined, "Posting…")
            : t("console.legend.community.composer.post", undefined, "Post")}
        </button>
      </div>
      {state?.error && (
        <p className="ps-alert ps-alert--danger" role="alert">
          {resolveActionError(state.error, t)}
        </p>
      )}
    </form>
  );
}
