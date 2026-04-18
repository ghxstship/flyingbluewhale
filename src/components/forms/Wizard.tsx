"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type WizardStep = {
  id: string;
  title: string;
  description?: string;
  /** Async validator before allowing forward navigation. Return error message or null. */
  validate?: () => Promise<string | null> | string | null;
  render: () => React.ReactNode;
};

export function Wizard({
  steps,
  onComplete,
  initialStep = 0,
  finishLabel = "Finish",
}: {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  initialStep?: number;
  finishLabel?: string;
}) {
  const [active, setActive] = React.useState(initialStep);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const isFirst = active === 0;
  const isLast = active === steps.length - 1;
  const current = steps[active];

  async function next() {
    setError(null);
    if (current.validate) {
      setPending(true);
      const err = await current.validate();
      setPending(false);
      if (err) {
        setError(err);
        return;
      }
    }
    if (isLast) {
      setPending(true);
      try {
        await onComplete();
      } finally {
        setPending(false);
      }
    } else {
      setActive((a) => a + 1);
    }
  }

  function prev() {
    setError(null);
    setActive((a) => Math.max(0, a - 1));
  }

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-3" aria-label="Progress">
        {steps.map((step, i) => {
          const isComplete = i < active;
          const isCurrent = i === active;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isComplete
                    ? "border-[var(--org-primary)] bg-[var(--org-primary)] text-white"
                    : isCurrent
                      ? "border-[var(--org-primary)] text-[var(--org-primary)]"
                      : "border-[var(--border-color)] text-[var(--text-muted)]"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <Check size={12} /> : i + 1}
              </div>
              <div className="hidden text-xs sm:block">
                <div className={`font-medium ${isCurrent ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                  {step.title}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 ${isComplete ? "bg-[var(--org-primary)]" : "bg-[var(--border-color)]"}`} />
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
        <div className="mt-6">{current.render()}</div>
        {error && (
          <div role="alert" className="mt-4 rounded border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 p-2 text-xs text-[var(--color-error)]">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={prev}
          disabled={isFirst || pending}
          aria-label="Previous step"
        >
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
