import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * OnboardingStepper — the canonical guided-setup scaffold (design-system canon,
 * `kits/core/components/access/OnboardingStepper`). Spans org → project → scope
 * onboarding levels; product surfaces compose it with their own step bodies
 * (GVTEWAY taste onboarding, COMPVSS field setup, operator org onboarding). One
 * primitive, per guidelines/atlvs-kit-coherence-audit.md.
 *
 * Presentational: it renders the brand, the step rail (with done/active/upcoming
 * states), the active step body (children), and a footer. Token-only colors.
 */
export type OnboardingStep = { id: string; label: ReactNode; hint?: ReactNode; level?: "org" | "project" | "scope" | string };

export function OnboardingStepper({
  steps,
  current = 0,
  title,
  children,
  footer,
  brand,
  className = "",
}: {
  steps: OnboardingStep[];
  /** 0-indexed active step. */
  current?: number;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  brand?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-md ${className}`}>
      {brand && <div className="mb-6">{brand}</div>}

      <ol className="mb-6 flex items-center gap-2" aria-label="Progress">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-[var(--p-accent)] text-[var(--p-accent-cta-contrast)]"
                    : active
                      ? "border-2 border-[var(--p-accent)] text-[var(--p-accent-text)]"
                      : "border border-[var(--p-border-2)] text-[var(--p-text-3)]"
                }`}
              >
                {done ? <Check size={12} aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`hidden truncate text-xs font-medium sm:inline ${
                  active ? "text-[var(--p-text-1)]" : "text-[var(--p-text-3)]"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 ${done ? "bg-[var(--p-accent)]" : "bg-[var(--p-border)]"}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {title && <h1 className="text-[length:var(--p-fs-h2)]">{title}</h1>}
      {steps[current]?.hint && <p className="mt-2 text-sm text-[var(--p-text-2)]">{steps[current]!.hint}</p>}

      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 text-center text-xs text-[var(--p-text-2)]">{footer}</div>}
    </div>
  );
}
