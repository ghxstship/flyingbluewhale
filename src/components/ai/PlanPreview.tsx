"use client";

import { CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type PlanStep = {
  label: string;
  description: string;
  reversible: boolean;
};

export type Plan = {
  summary: string;
  steps: PlanStep[];
  warnings: string[] | null;
  estimated_scope: "small" | "medium" | "large";
};

const SCOPE_TONE: Record<Plan["estimated_scope"], string> = {
  small: "text-[var(--p-success)]",
  medium: "text-[var(--p-warning)]",
  large: "text-[var(--p-danger)]",
};

/**
 * Human-in-the-loop action plan preview. Shown before the AI executes
 * any multi-step action so the user can confirm or cancel. Pattern
 * adapted from Deputy AI's "confirm before act" guardrail and LASSO
 * Intelligence's Act mode.
 */
export function PlanPreview({
  plan,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm & Execute",
  confirming = false,
}: {
  plan: Plan;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirming?: boolean;
}) {
  return (
    <div className="surface rounded-lg border border-[var(--p-border)] overflow-hidden">
      <div className="bg-[var(--p-surface-raised)] px-5 py-4 border-b border-[var(--p-border)]">
        <p className="text-xs font-semibold text-[var(--p-text-2)] uppercase tracking-wide">Action plan</p>
        <p className="mt-1 text-sm font-medium">{plan.summary}</p>
        <span
          className={`mt-1 text-[11px] font-mono ${SCOPE_TONE[plan.estimated_scope]}`}
          aria-label={`Scope: ${plan.estimated_scope}`}
        >
          {plan.estimated_scope} scope
        </span>
      </div>

      <ol className="divide-y divide-[var(--p-border)]">
        {plan.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--p-surface-raised)] font-mono text-[10px] text-[var(--p-text-2)]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{step.label}</p>
              <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{step.description}</p>
            </div>
            <div className="shrink-0 mt-0.5">
              {step.reversible ? (
                <CheckCircle size={13} className="text-[var(--p-success)]" aria-label="Reversible" />
              ) : (
                <ChevronRight size={13} className="text-[var(--p-text-2)]" aria-label="Irreversible" />
              )}
            </div>
          </li>
        ))}
      </ol>

      {plan.warnings && plan.warnings.length > 0 && (
        <div className="border-t border-[var(--p-border)] bg-[var(--p-warning-subtle,#fef9c3)] px-5 py-3 space-y-1">
          {plan.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--p-warning-fg,#92400e)]">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {w}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-[var(--p-border)] px-5 py-3.5">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={onConfirm} disabled={confirming}>
          {confirming ? "Executing…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
