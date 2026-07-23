"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/components/FormShell";

import { useActionErrorResolver } from "@/lib/errors-client";
/**
 * MultiStepForm (P1.c) — paginated public/intake form with a progress
 * indicator and an optional review-before-submit step. SmartSuite "Forms:
 * multiple pages + progress bar + review page" parity.
 *
 * Design:
 *  - All step field groups stay mounted (so a single native submit captures
 *    every value); inactive steps are `hidden`.
 *  - The form is `noValidate`, so a `required` field on a not-yet-visited
 *    step can't block the final submit or steal focus. Per-step validation
 *    runs in JS via `checkValidity()`/`reportValidity()` on the ACTIVE step
 *    only when advancing — the field being reported is always visible.
 *  - The server action re-validates everything and returns `FormState`
 *    ({ error, fieldErrors }) exactly like FormShell, so this composes with
 *    the existing `formFail`/`actionFail` helpers.
 */
export type FormStep = { title: string; description?: string; fields: ReactNode };

export function MultiStepForm({
  action,
  steps,
  submitLabel = "Submit",
  cancelHref,
  review = true,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  steps: FormStep[];
  submitLabel?: string;
  cancelHref?: string;
  /** Append a read-only review page before submit. Default true. */
  review?: boolean;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const resolveErr = useActionErrorResolver();
  const formRef = useRef<HTMLFormElement>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);
  const [summary, setSummary] = useState<Array<[string, string]>>([]);

  const pageCount = steps.length + (review ? 1 : 0);
  const isReviewPage = review && active === steps.length;
  const isLastPage = active === pageCount - 1;

  function validateActiveStep(): boolean {
    const container = stepRefs.current[active];
    if (!container) return true;
    const controls = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea"),
    );
    for (const el of controls) {
      if (!el.checkValidity()) {
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  function next() {
    if (active < steps.length && !validateActiveStep()) return;
    // Entering the review page — snapshot current values for the summary.
    if (review && active === steps.length - 1 && formRef.current) {
      const fd = new FormData(formRef.current);
      const pairs: Array<[string, string]> = [];
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string" && v.trim().length > 0) pairs.push([k, v]);
      }
      setSummary(pairs);
    }
    setActive((i) => Math.min(i + 1, pageCount - 1));
  }

  function back() {
    setActive((i) => Math.max(i - 1, 0));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="surface space-y-5 p-6"
      aria-label="Multi-step form"
    >
      {/* Progress indicator — numbered dots with the active page labelled. */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Progress">
        {Array.from({ length: pageCount }).map((_, i) => {
          const label = i < steps.length ? steps[i]?.title : "Review";
          const done = i < active;
          const current = i === active;
          return (
            <li key={i} className="flex items-center gap-2">
              <span
                aria-current={current ? "step" : undefined}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  current
                    ? "bg-[var(--p-accent)] text-white"
                    : done
                      ? "bg-[var(--p-success)]/20 text-[var(--p-success)]"
                      : "bg-[var(--p-surface)] text-[var(--p-text-2)] ring-1 ring-[var(--p-border)]"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-xs ${current ? "text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}>{label}</span>
              {i < pageCount - 1 ? <span className="text-[var(--p-text-2)]">·</span> : null}
            </li>
          );
        })}
      </ol>

      {state?.error ? (
        <p role="alert" className="rounded-md bg-[var(--p-danger)]/10 px-3 py-2 text-sm text-[var(--p-danger)]">
          {resolveErr(state.error)}
        </p>
      ) : null}

      {/* All step field groups stay mounted; inactive ones are hidden. */}
      {steps.map((step, i) => (
        <div
          key={i}
          ref={(el) => {
            stepRefs.current[i] = el;
          }}
          hidden={active !== i}
          className="space-y-4"
        >
          <div>
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">{step.title}</h2>
            {step.description ? <p className="text-xs text-[var(--p-text-2)]">{step.description}</p> : null}
          </div>
          {step.fields}
        </div>
      ))}

      {isReviewPage ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Review</h2>
          {summary.length === 0 ? (
            <p className="text-sm text-[var(--p-text-2)]">Nothing entered yet.</p>
          ) : (
            <dl className="divide-y divide-[var(--p-border)] rounded-md border border-[var(--p-border)]">
              {summary.map(([k, v]) => (
                <div key={k} className="flex gap-4 px-3 py-2 text-sm">
                  <dt className="w-40 shrink-0 font-mono text-xs text-[var(--p-text-2)]">{k}</dt>
                  <dd className="min-w-0 break-words text-[var(--p-text-1)]">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <button
            type="button"
            onClick={() => setActive(0)}
            className="text-xs text-[var(--p-accent)] underline"
          >
            Edit answers
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-2">
        <div>
          {cancelHref ? (
            <Button href={cancelHref} variant="ghost" size="sm">
              Cancel
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {active > 0 ? (
            <Button type="button" variant="secondary" size="sm" onClick={back} disabled={pending}>
              Back
            </Button>
          ) : null}
          {isLastPage ? (
            <Button type="submit" size="sm" loading={pending}>
              {submitLabel}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={next}>
              Next
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
