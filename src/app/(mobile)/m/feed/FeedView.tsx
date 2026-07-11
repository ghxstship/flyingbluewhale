"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ActionBar, KIcon, TogRow } from "@/components/mobile/kit";
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
  // createPost's success value is `null` — the same as useActionState's INITIAL
  // value, so `state === null` alone can't mean "posted". Track that a submit
  // actually ran, or the close-composer effect fires the instant the composer
  // opens and it can never be used.
  const submitRan = useRef(false);

  // Kit ActionBar state (canon: ActionBar on every list screen).
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [tones, setTones] = useState<Set<FeedPost["tagTone"]>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggleTone = (tone: FeedPost["tagTone"]) =>
    setTones((s) => {
      const n = new Set(s);
      if (n.has(tone)) n.delete(tone);
      else n.add(tone);
      return n;
    });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = posts.filter(
      (p) =>
        (!q || `${p.who} ${p.body} ${p.tag}`.toLowerCase().includes(q)) &&
        (tones.size === 0 || tones.has(p.tagTone)),
    );
    return sort === "oldest" ? filtered.slice().reverse() : filtered;
  }, [posts, query, sort, tones]);

  useEffect(() => {
    if (pending) {
      submitRan.current = true;
      return;
    }
    if (submitRan.current && state === null && open) {
      submitRan.current = false;
      formRef.current?.reset();
      setOpen(false);
    }
  }, [pending, state, open]);

  return (
    <>
      <ActionBar
        k="feed"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.feed.search", undefined, "Search the feed…")}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["newest", t("m.feed.sort.newest", undefined, "Newest")],
          ["oldest", t("m.feed.sort.oldest", undefined, "Oldest")],
        ]}
        filterActive={tones.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <TogRow label={t("m.feed.tag.kudos", undefined, "Kudos")} on={tones.has("ok")} set={() => toggleTone("ok")} />
            <TogRow label={t("m.feed.tag.update", undefined, "Update")} on={tones.has("info")} set={() => toggleTone("info")} />
          </div>
        }
      />
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

      {!eyebrowEmpty && visible.length === 0 && posts.length > 0 && (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.feed.noMatch", undefined, "Nothing matches your search.")}
        </div>
      )}
      {!eyebrowEmpty &&
        visible.map((p) => {
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
