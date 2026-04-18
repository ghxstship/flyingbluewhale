"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type WizardStep<Ctx = unknown> = {
  id: string;
  title: string;
  description?: string;
  /** Async validator before allowing forward navigation. Return error string or null. */
  validate?: (ctx: Ctx) => Promise<string | null> | string | null;
  /** Conditional visibility — step is skipped when this returns false. */
  visible?: (ctx: Ctx) => boolean;
  render: (ctx: Ctx) => React.ReactNode;
};

/**
 * Wizard v2 — benchmark: Stripe Connect onboarding.
 * - URL-hash step persistence (`#step-{id}`)
 * - Conditional step visibility via `visible(ctx)` for branching flows
 * - Context passes through every step so pages can share state
 */
export function Wizard<Ctx = void>({
  steps,
  onComplete,
  context,
  finishLabel = "Finish",
}: {
  steps: WizardStep<Ctx>[];
  onComplete: (ctx: Ctx) => void | Promise<void>;
  context?: Ctx;
  finishLabel?: string;
}) {
  const ctx = context as Ctx;

  // Only visible steps count for navigation
  const visibleSteps = React.useMemo(
    () => steps.filter((s) => (s.visible ? s.visible(ctx) : true)),
    [steps, ctx],
  );

  // Read initial active step from URL hash
  const readHash = React.useCallback((): number => {
    if (typeof window === "undefined") return 0;
    const raw = window.location.hash.replace(/^#step-?/, "");
    if (!raw) return 0;
    const idx = visibleSteps.findIndex((s) => s.id === raw);
    return idx >= 0 ? idx : 0;
  }, [visibleSteps]);

  const [active, setActive] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  // Initial hash sync (deferred to avoid SSR hydration mismatch)
  React.useEffect(() => {
    setActive(readHash());
    function onHash() {
      setActive(readHash());
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [readHash]);

  function gotoStep(i: number) {
    const step = visibleSteps[i];
    if (!step) return;
    setActive(i);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#step-${step.id}`);
    }
  }

  const isFirst = active === 0;
  const isLast = active === visibleSteps.length - 1;
  const current = visibleSteps[active];

  async function next() {
    if (!current) return;
    setError(null);
    if (current.validate) {
      setPending(true);
      const err = await current.validate(ctx);
      setPending(false);
      if (err) {
        setError(err);
        return;
      }
    }
    if (isLast) {
      setPending(true);
      try {
        await onComplete(ctx);
      } finally {
        setPending(false);
      }
    } else {
      gotoStep(active + 1);
    }
  }

  function prev() {
    setError(null);
    gotoStep(Math.max(0, active - 1));
  }

  if (!current) return null;

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-3" aria-label="Progress">
        {visibleSteps.map((step, i) => {
          const isComplete = i < active;
          const isCurrent = i === active;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => i <= active && gotoStep(i)}
                disabled={i > active}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  isComplete
                    ? "border-[var(--org-primary)] bg-[var(--org-primary)] text-white"
                    : isCurrent
                      ? "border-[var(--org-primary)] text-[var(--org-primary)]"
                      : "border-[var(--border-color)] text-[var(--text-muted)]"
                } ${i <= active ? "cursor-pointer" : "cursor-default"}`}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${step.title}`}
              >
                {isComplete ? <Check size={12} /> : i + 1}
              </button>
              <div className="hidden text-xs sm:block">
                <div
                  className={`font-medium ${
                    isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.title}
                </div>
              </div>
              {i < visibleSteps.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    isComplete ? "bg-[var(--org-primary)]" : "bg-[var(--border-color)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="surface-raised p-6">
        <div className="text-lg font-semibold tracking-tight">{current.title}</div>
        {current.description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{current.description}</p>
        )}
        <div className="mt-6">{current.render(ctx)}</div>
        {error && (
          <div
            role="alert"
            className="mt-4 rounded border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-2 text-xs text-[var(--color-error)]"
          >
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={prev} disabled={isFirst || pending} aria-label="Previous step">
          <ChevronLeft size={14} /> Back
        </Button>
        <Button onClick={next} loading={pending}>
          {isLast ? finishLabel : "Continue"}
          {!isLast && <ChevronRight size={14} className="ms-1" />}
        </Button>
      </div>
    </div>
  );
}
