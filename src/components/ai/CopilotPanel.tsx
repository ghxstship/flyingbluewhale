"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * CopilotPanel — the v7.7 grounded answer card. Asks POST /api/v1/ai/copilot,
 * which answers ONLY from the org's indexed corpus, and renders the answer with
 * its real source citations + a confidence grade. Never fabricates: an
 * ungrounded result shows low confidence and no citations.
 */
type Citation = { sourceType: string; sourceId: string; excerpt: string; similarity: number };
type CopilotResponse = {
  answer: string;
  citations: Citation[];
  confidence: "high" | "medium" | "low";
  grounded: boolean;
};

// Source kind → console detail route (mirrors the action-items rollup). Kinds
// without a first-class detail page render as a non-link chip.
const SOURCE_HREF: Record<string, (id: string) => string> = {
  rfi: (id) => `/studio/rfis/${id}`,
  submittal: (id) => `/studio/submittals/${id}`,
  deliverable: (id) => `/studio/deliverables/${id}`,
  proposal: (id) => `/studio/proposals/${id}`,
  contract: (id) => `/studio/contracts/${id}`,
  daily_log: (id) => `/studio/daily-logs/${id}`,
  meeting_note: (id) => `/studio/meetings/${id}`,
};

const CONFIDENCE_TONE: Record<CopilotResponse["confidence"], string> = {
  high: "var(--p-success-text)",
  medium: "var(--p-warning-text)",
  low: "var(--p-danger-text)",
};

type Labels = {
  placeholder: string;
  ask: string;
  asking: string;
  confidence: string;
  sources: string;
  ungrounded: string;
  error: string;
};

export function CopilotPanel({ labels }: { labels: Labels }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    const q = question.trim();
    if (q.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/v1/ai/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const body = await r.json();
      if (!r.ok || !body.ok) {
        setError(body?.error?.message ?? labels.error);
        setResult(null);
      } else {
        setResult(body.data as CopilotResponse);
      }
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-4)", maxWidth: "var(--p-content-max, 760px)" }}>
      <div style={{ display: "flex", gap: "var(--p-2)", alignItems: "flex-end" }}>
        <textarea
          className="ps-input"
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void ask();
            }
          }}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          style={{ flex: 1, resize: "vertical" }}
        />
        <button type="button" className="ps-btn" onClick={() => void ask()} disabled={loading || question.trim().length < 3}>
          {loading ? labels.asking : labels.ask}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "var(--p-3)",
            borderRadius: "var(--p-r-md, 10px)",
            background: "var(--p-danger-bg, var(--p-surface-2))",
            color: "var(--p-danger-text)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <section className="surface" style={{ padding: "var(--p-5)", borderRadius: "var(--p-r-xl, 16px)" }} aria-live="polite">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--p-2)", marginBottom: "var(--p-3)" }}>
            <span className="ps-badge" style={{ color: CONFIDENCE_TONE[result.confidence], fontWeight: 600, textTransform: "capitalize" }}>
              {labels.confidence}: {result.confidence}
            </span>
            {!result.grounded && <span style={{ fontSize: 12, color: "var(--p-text-3)" }}>{labels.ungrounded}</span>}
          </div>

          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{result.answer}</p>

          {result.citations.length > 0 && (
            <div style={{ marginTop: "var(--p-4)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--p-text-2)", marginBottom: "var(--p-2)" }}>
                {labels.sources}
              </div>
              <ol style={{ margin: 0, paddingLeft: "var(--p-4)", display: "flex", flexDirection: "column", gap: "var(--p-2)" }}>
                {result.citations.map((c, i) => {
                  const href = SOURCE_HREF[c.sourceType]?.(c.sourceId);
                  const label = (
                    <>
                      <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{c.sourceType.replace(/_/g, " ")}</span>
                      <span style={{ color: "var(--p-text-3)", fontVariantNumeric: "tabular-nums" }}> · {Math.round(c.similarity * 100)}%</span>
                    </>
                  );
                  return (
                    <li key={`${c.sourceId}-${i}`} style={{ fontSize: 13 }}>
                      {href ? (
                        <Link href={href} style={{ color: "var(--p-accent-text)" }}>
                          {label}
                        </Link>
                      ) : (
                        label
                      )}
                      <div style={{ color: "var(--p-text-2)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.excerpt}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
