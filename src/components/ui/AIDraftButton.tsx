"use client";

import { useState, useRef, useCallback } from "react";

export type AIDraftType = "announcement" | "course_outline" | "proposal_draft";

export type AIDraftResult =
  | { type: "announcement"; title: string; body: string }
  | { type: "course_outline"; title: string; summary: string; lessons: Array<{ title: string; objective: string }> }
  | { type: "proposal_draft"; title: string; notes: string };

interface Props {
  draftType: AIDraftType;
  /** Called with the parsed JSON result once streaming is complete. */
  onDraft: (result: AIDraftResult) => void;
  /** Pre-fill the topic field from a form value if available. */
  topicHint?: string;
  audience?: string;
  projectName?: string;
}

/**
 * Inline "Draft with AI" affordance. Renders a compact trigger button that
 * expands into a one-field prompt input, streams the generate endpoint, and
 * calls `onDraft` with the parsed JSON when done.
 */
export function AIDraftButton({ draftType, onDraft, topicHint = "", audience, projectName }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(topicHint);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setError(null);
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: draftType,
          context: { topic, audience, projectName },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } })?.error?.message ?? "Generation failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rawJson = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: delta")) continue;
          if (line.startsWith("data: ")) {
            const payload = line.slice(6);
            try {
              const parsed = JSON.parse(payload) as { text?: string; result?: string; message?: string };
              if (parsed.message) throw new Error(parsed.message);
              if (parsed.result) rawJson = parsed.result;
              else if (parsed.text) rawJson += parsed.text;
            } catch {
              // tolerate partial-line noise during streaming
            }
          }
        }
      }

      const result = JSON.parse(rawJson) as AIDraftResult;
      onDraft({ ...result, type: draftType } as AIDraftResult);
      setOpen(false);
      setTopic("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Generation failed");
      }
    } finally {
      setStreaming(false);
    }
  }, [topic, draftType, audience, projectName, onDraft]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setTopic(topicHint); setOpen(true); }}
        className="ps-btn ps-btn--ghost ps-btn--sm flex items-center gap-1.5 text-[var(--p-accent)]"
      >
        <span aria-hidden>✦</span> Draft with AI
      </button>
    );
  }

  return (
    <div className="surface-raised rounded-lg border border-[var(--p-border)] p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--p-text-2)] uppercase tracking-wide">AI Draft</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {draftType === "announcement" ? "What do you want to announce?" : draftType === "course_outline" ? "What should this course teach?" : "Describe the scope or service"}
        </span>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. Load-in starts at 06:00 Saturday, all crew report to Stage 2 first…"
          className="ps-input focus-ring w-full text-sm"
          disabled={streaming}
          autoFocus
        />
      </label>
      {error && <p className="text-xs text-[var(--p-error)]">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); abortRef.current?.abort(); }}
          className="ps-btn ps-btn--ghost ps-btn--sm"
          disabled={streaming}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={streaming || !topic.trim()}
          className="ps-btn ps-btn--sm"
        >
          {streaming ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}
