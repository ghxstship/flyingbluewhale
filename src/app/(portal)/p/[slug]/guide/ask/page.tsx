"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";

export const dynamic = "force-dynamic";

export default function GuideAskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "guide_qa",
          context: `Event guide for ${slug}`,
          question: question.trim(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { content: string }; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? "AI request failed");
      setAnswer(json.data?.content ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-content max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/p/${slug}/guide`} className="ps-btn ps-btn--ghost ps-btn--sm">
          ← Event Guide
        </Link>
        <h1 className="ps-h text-xl">Ask a Question</h1>
      </div>

      <div className="surface p-6">
        <p className="mb-4 text-sm text-[var(--p-text-2)]">
          Have a question about the event? Ask the AI assistant — it will answer based on the event guide.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="text-xs font-medium text-[var(--p-text-2)]">
              Your Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="ps-input mt-1.5 w-full"
              placeholder="e.g. What time does the venue open? Where is the VIP entrance?"
              required
              maxLength={2000}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="ps-btn ps-btn--primary"
          >
            {loading ? "Thinking…" : "Get Answer →"}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-4 surface-raised border border-[var(--p-danger)] p-4 text-sm text-[var(--p-danger)]">
          {error}
        </div>
      )}

      {answer !== null && (
        <div className="mt-4 surface-raised p-5">
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--p-text-2)]">
            Answer
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}
