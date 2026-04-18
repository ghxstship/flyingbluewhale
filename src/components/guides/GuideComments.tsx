"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatRelative } from "@/lib/i18n/format";

type Comment = {
  id: string;
  body: string;
  author_name: string | null;
  created_at: string;
  resolved_at: string | null;
};

export function GuideComments({
  guideId,
  orgId,
  initial = [],
}: {
  guideId: string;
  orgId: string;
  initial?: Comment[];
}) {
  const [comments, setComments] = React.useState(initial);
  const [name, setName] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/guides/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          guideId,
          orgId,
          body: body.trim(),
          authorName: name.trim() || null,
        }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { comment: Comment } }
        | { ok: false; error: { message: string } };
      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error?.message) || "Couldn't post comment");
      }
      setComments((prev) => [json.data.comment, ...prev]);
      setBody("");
      toast.success("Posted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-8">
      <h2 id="comments-heading" className="flex items-center gap-2 text-sm font-semibold">
        <MessageCircle size={14} aria-hidden="true" />
        Comments {comments.length > 0 && <span className="text-[var(--text-muted)]">({comments.length})</span>}
      </h2>

      <form onSubmit={submit} className="mt-3 space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          aria-label="Your name"
          className="input-base text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment or question…"
          aria-label="Comment body"
          rows={3}
          required
          className="input-base w-full resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button type="submit" loading={submitting} disabled={!body.trim()}>
            <Send size={12} className="me-1" aria-hidden="true" /> Post
          </Button>
        </div>
      </form>

      <ul className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <li className="rounded border border-dashed border-[var(--border-color)] py-6 text-center text-xs text-[var(--text-muted)]">
            No comments yet.
          </li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="surface p-3">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">{c.author_name ?? "Anonymous"}</span>
                <time className="text-[var(--text-muted)]" dateTime={c.created_at}>
                  {formatRelative(c.created_at)}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
