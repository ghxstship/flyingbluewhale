"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPostAction, type State } from "./actions";
import { POST_CATEGORIES, POST_CATEGORY_LABELS } from "@/lib/legend_community";

/**
 * Inline community post composer. Posts to the server action; clears on
 * success. Token-only styling, ≥44px controls.
 */
export function PostComposer() {
  const [state, action, pending] = useActionState<State, FormData>(createPostAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="surface flex flex-col gap-3 p-4">
      <input
        name="title"
        required
        placeholder="Share a win, ask a question…"
        className="ps-input"
        style={{ minHeight: 44 }}
      />
      <textarea name="body_html" placeholder="Add detail (optional)" className="ps-input" rows={3} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select name="category" className="ps-input ps-input--sm" defaultValue="general" aria-label="Category" style={{ minHeight: 44 }}>
          {POST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {POST_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="ps-btn ps-btn--cta" style={{ minHeight: 44 }}>
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      {state?.error && (
        <p className="ps-alert ps-alert--danger" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
