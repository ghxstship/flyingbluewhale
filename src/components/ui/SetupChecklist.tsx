"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * SetupChecklist — the activation / time-to-value card (v7.7). Renders the
 * org's create → import → invite → go-live chain with a progress meter; each
 * incomplete step links to its action. Self-retires when every step is done or
 * the user dismisses it (per-org, persisted to localStorage). Token-only + a11y
 * (ordered list, progressbar, completed steps marked aria-disabled).
 */
export type SetupChecklistStep = { id: string; label: string; href: string; done: boolean };

type Labels = { title?: string; subtitle?: string; dismiss?: string; progress?: (done: number, total: number) => string };

export function SetupChecklist({
  steps,
  orgId,
  labels = {},
  className = "",
}: {
  steps: SetupChecklistStep[];
  /** Scopes the dismissal so switching workspaces shows each org's own checklist. */
  orgId: string;
  labels?: Labels;
  className?: string;
}) {
  const t = {
    title: "Finish setting up",
    subtitle: "A few steps to get your workspace operating.",
    dismiss: "Dismiss",
    progress: (done: number, total: number) => `${done} of ${total} done`,
    ...labels,
  };
  const done = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = done === total;
  const key = `atlvs.setup.dismissed.${orgId}`;

  const [dismissed, setDismissed] = useState(true); // assume hidden until we read storage (SSR-safe)
  useEffect(() => {
    setDismissed(localStorage.getItem(key) === "1");
  }, [key]);

  if (allDone || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* storage blocked — still hide for the session */
    }
    setDismissed(true);
  };

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section
      className={`surface ${className}`}
      aria-label={t.title}
      style={{ padding: "var(--p-5)", borderRadius: "var(--p-r-xl, 16px)" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--p-3)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16 }}>{t.title}</h2>
          <p style={{ margin: "var(--p-1) 0 0", color: "var(--p-text-2)", fontSize: 13 }}>{t.subtitle}</p>
        </div>
        <button type="button" className="ps-btn ps-btn--tertiary ps-btn--sm" onClick={dismiss}>
          {t.dismiss}
        </button>
      </div>

      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t.progress(done, total)}
        style={{
          height: 6,
          margin: "var(--p-3) 0",
          borderRadius: "var(--p-r-pill, 999px)",
          background: "var(--p-surface-2)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--p-accent)", borderRadius: "inherit" }} />
      </div>
      <p
        style={{
          margin: "0 0 var(--p-3)",
          fontSize: 12,
          fontVariantNumeric: "tabular-nums",
          color: "var(--p-text-2)",
        }}
      >
        {t.progress(done, total)}
      </p>

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--p-2)" }}>
        {steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <span
                aria-disabled="true"
                style={{ display: "flex", alignItems: "center", gap: "var(--p-2)", color: "var(--p-text-3)" }}
              >
                <Check done />
                <span style={{ textDecoration: "line-through" }}>{step.label}</span>
              </span>
            ) : (
              <Link
                href={step.href}
                className="hover-lift"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--p-2)",
                  color: "var(--p-text-1)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <Check done={false} />
                <span>{step.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Tiny token-only status dot: filled accent check when done, hollow ring otherwise. */
function Check({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: "0 0 auto",
        width: 18,
        height: 18,
        borderRadius: "999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: done ? "var(--p-accent)" : "transparent",
        border: done ? "none" : "2px solid var(--p-border-2)",
        color: "var(--p-accent-contrast, #fff)",
        fontSize: 11,
        lineHeight: 1,
      }}
    >
      {done ? "✓" : ""}
    </span>
  );
}
