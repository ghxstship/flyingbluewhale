"use client";

import { useState } from "react";
import { KIcon } from "./icon";

/**
 * Canonical comments + @mention thread. Ported from the prototype
 * `CommentsBlock` — reused by RecordDetail-less screens (tasks).
 *
 * Presentational: the caller supplies the comment list + taggable people
 * and handles persistence via `onComment(text, mentions)`.
 */
export type Comment = {
  who: string;
  time: string;
  text: string;
  mentions?: string[];
};

export type CommentsBlockProps = {
  comments?: Comment[];
  people?: string[];
  onComment: (text: string, mentions: string[]) => void;
};

export function CommentsBlock({ comments = [], people = [], onComment }: CommentsBlockProps) {
  const [draft, setDraft] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  const [tagOpen, setTagOpen] = useState(false);
  const post = () => {
    if (!draft.trim()) return;
    onComment(draft.trim(), tagged);
    setDraft("");
    setTagged([]);
    setTagOpen(false);
  };
  return (
    <div>
      <div className="sech">
        <h2>Comments</h2>
        {comments.length ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{comments.length}</span>
        ) : null}
      </div>
      {comments.map((c, j) => (
        <div className="item" key={j} style={{ alignItems: "flex-start" }}>
          <span className="avatar-sm" style={{ flex: "none" }}>
            {c.who
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
              <div className="t" style={{ fontSize: 13 }}>
                {c.who}
              </div>
              <span className="s" style={{ fontSize: 11 }}>
                {c.time}
              </span>
            </div>
            <div className="s" style={{ color: "var(--p-text-2)", marginTop: 2 }}>
              {c.mentions &&
                c.mentions.map((m) => (
                  <span key={m} style={{ color: "var(--p-accent-text)", fontWeight: 600 }}>
                    @{m}{" "}
                  </span>
                ))}
              {c.text}
            </div>
          </div>
        </div>
      ))}
      {tagged.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 6px" }}>
          {tagged.map((t) => (
            <span
              key={t}
              className="tag-chip"
              style={{ cursor: "pointer" }}
              onClick={() => setTagged((s) => s.filter((x) => x !== t))}
            >
              @{t} <KIcon name="X" size={11} />
            </span>
          ))}
        </div>
      )}
      {tagOpen && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {people
            .filter((p) => !tagged.includes(p))
            .map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTagged((s) => [...s, p])}
                style={{
                  border: "1px solid var(--p-border)",
                  background: "var(--p-surface)",
                  borderRadius: 999,
                  padding: "5px 11px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setTagOpen((o) => !o)}
          aria-label="Tag people"
          style={{
            flex: "none",
            width: 40,
            height: 40,
            borderRadius: 50,
            border: "1px solid var(--p-border)",
            background: tagOpen ? "var(--p-accent)" : "var(--p-surface)",
            color: tagOpen ? "#1f0e03" : "var(--p-text-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <KIcon name="AtSign" size={17} />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") post();
          }}
          placeholder="Add a comment…"
          style={{
            flex: 1,
            border: "1px solid var(--p-border)",
            borderRadius: 20,
            padding: "10px 15px",
            fontSize: 13.5,
            background: "var(--p-surface)",
          }}
        />
        <button
          type="button"
          onClick={post}
          aria-label="Post"
          style={{
            flex: "none",
            border: "none",
            background: "var(--p-accent)",
            color: "#1f0e03",
            width: 40,
            height: 40,
            borderRadius: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <KIcon name="ArrowUp" size={18} />
        </button>
      </div>
    </div>
  );
}
