"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createPost, type State } from "./actions";

/**
 * FeedView — the COMPVSS Community client leaf. Renders the `.composer-cta`
 * (expands to an inline post box) and the `.post` cards with like / comment /
 * share foot actions. Posting routes through the createPost server action.
 *
 * Design truth: prototype community tab (app.jsx 2133-2180) + COMMUNITY_POSTS
 * (905-911).
 */

export type FeedPost = {
  id: string;
  who: string;
  av: string;
  role: string;
  body: string;
  tag: string;
  tagTone: "ok" | "info" | "neutral";
  when: string;
  sortAt: string;
};

const TONE_CLASS: Record<FeedPost["tagTone"], string> = {
  ok: "ps-badge--ok",
  info: "ps-badge--info",
  neutral: "ps-badge--neutral",
};

export function FeedView({
  posts,
  myInitials,
  eyebrowEmpty = false,
}: {
  posts: FeedPost[];
  myInitials: string;
  eyebrowEmpty?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState<State, FormData>(createPost, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && state === null && open) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [pending, state, open]);

  return (
    <>
      {open ? (
        <form action={formAction} ref={formRef} className="surface" style={{ padding: 12, marginBottom: 14, borderRadius: "var(--p-r-md)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span className="avatar" style={{ width: 38, height: 38, flex: "none" }}>{myInitials}</span>
            <textarea
              name="message"
              required
              maxLength={2000}
              rows={3}
              autoFocus
              placeholder={t("m.feed.composerPlaceholder", undefined, "Share an update…")}
              className="ps-input"
              style={{ flex: 1, resize: "vertical" }}
            />
          </div>
          {state?.error && (
            <div className="s" style={{ color: "var(--p-danger-text)", marginTop: 8 }}>{state.error}</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
            <button type="button" className="pill" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel", undefined, "Cancel")}
            </button>
            <button type="submit" className="ps-btn ps-btn--cta" disabled={pending}>
              {t("m.feed.post", undefined, "Post")}
            </button>
          </div>
        </form>
      ) : (
        <div
          className="composer-cta"
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className="avatar" style={{ width: 38, height: 38, flex: "none" }}>{myInitials}</span>
          <span className="cc-box">{t("m.feed.composerPlaceholder", undefined, "Share an update…")}</span>
          <KIcon name="Image" size={18} style={{ color: "var(--p-text-3)" }} />
        </div>
      )}

      {!eyebrowEmpty &&
        posts.map((p) => {
          const isLiked = liked.has(p.id);
          return (
            <div className="post" key={p.id}>
              <div className="post-head">
                <span className="avatar-sm">{p.av}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{p.who}</div>
                  <div className="s">{p.role}</div>
                </div>
                <span className={`ps-badge ${TONE_CLASS[p.tagTone]}`}>{p.tag}</span>
              </div>
              <div className="post-body">{p.body}</div>
              <div className="post-foot">
                <span className="time" style={{ color: "var(--p-text-3)" }}>{p.when}</span>
                <span style={{ flex: 1 }} />
                <button
                  type="button"
                  className="pa"
                  onClick={() =>
                    setLiked((s) => {
                      const n = new Set(s);
                      n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                      return n;
                    })
                  }
                  aria-pressed={isLiked}
                >
                  <KIcon name="ThumbsUp" size={15} /> {isLiked ? 1 : 0}
                </button>
                <button type="button" className="pa" aria-label={t("m.feed.comment", undefined, "Comment")}>
                  <KIcon name="MessageCircle" size={15} /> 0
                </button>
                <button type="button" className="pa" aria-label={t("m.feed.share", undefined, "Share")}>
                  <KIcon name="Share2" size={15} />
                </button>
              </div>
            </div>
          );
        })}
    </>
  );
}
