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

// Confidence grade → `.ai-conf` meter fill (kit-ai.css). The kit colors the
// bar itself (mid→high gradient, `data-level="low"` flips to low→mid); the
// width is the calibrated read of the grade.
const CONFIDENCE_WIDTH: Record<CopilotResponse["confidence"], string> = {
  high: "92%",
  medium: "58%",
  low: "24%",
};

type Labels = {
  placeholder: string;
  ask: string;
  asking: string;
  confidence: string;
  sources: string;
  ungrounded: string;
  error: string;
  /** Label for the retrieval-scope select (only used when scopes are passed). */
  scope?: string;
  /** The org-wide option label for the scope select. */
  scopeAll?: string;
};

export type CopilotScope = { id: string; name: string };

export function CopilotPanel({
  labels,
  scopes,
  initialProjectId,
}: {
  labels: Labels;
  /**
   * Optional event scopes (active projects). When provided, a scope select is
   * rendered and the chosen projectId rides the request — the API then
   * retrieves the EVENT corpus (that project's chunks + org-wide sources +
   * event-synced verified knowledge) instead of the whole workspace.
   */
  scopes?: CopilotScope[];
  initialProjectId?: string;
}) {
  const [question, setQuestion] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
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
        body: JSON.stringify({ question: q, ...(projectId ? { projectId } : {}) }),
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
      {scopes && scopes.length > 0 && (
        <label style={{ display: "flex", flexDirection: "column", gap: "var(--p-1)", fontSize: 12, fontWeight: 500 }}>
          {labels.scope}
          <select
            className="ps-input"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ maxWidth: 320 }}
          >
            <option value="">{labels.scopeAll}</option>
            {scopes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
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
        // kit-ai.css adoption (W5, F-28): the answer is an `.ai-msg` agentic
        // card — head (agent identity + grounding note), body (answer prose,
        // `.ai-conf` calibrated confidence meter, `.ai-cite` source chips).
        <section className="ai-msg" aria-live="polite">
          <div className="ai-msg__head">
            <span>Copilot</span>
            {!result.grounded && <span style={{ marginLeft: "auto", textTransform: "none", letterSpacing: 0 }}>{labels.ungrounded}</span>}
          </div>
          <div className="ai-msg__body">
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{result.answer}</p>

            <div className="ai-conf" data-level={result.confidence}>
              <div className="ai-conf__lab">
                <span>{labels.confidence}</span>
                <span>{result.confidence}</span>
              </div>
              <div className="ai-conf__bar">
                <i style={{ width: CONFIDENCE_WIDTH[result.confidence] }} />
              </div>
            </div>

            {result.citations.length > 0 && (
              <div className="ai-cites" aria-label={labels.sources}>
                {result.citations.map((c, i) => {
                  const href = SOURCE_HREF[c.sourceType]?.(c.sourceId);
                  const body = (
                    <>
                      <span className="ai-cite__n">{i + 1}</span>
                      <span style={{ textTransform: "capitalize" }}>{c.sourceType.replace(/_/g, " ")}</span>
                      <span style={{ opacity: 0.75 }}>· {Math.round(c.similarity * 100)}%</span>
                    </>
                  );
                  return href ? (
                    <Link key={`${c.sourceId}-${i}`} href={href} className="ai-cite" title={c.excerpt}>
                      {body}
                    </Link>
                  ) : (
                    <span key={`${c.sourceId}-${i}`} className="ai-cite" title={c.excerpt}>
                      {body}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
