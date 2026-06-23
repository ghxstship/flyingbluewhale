import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * <Steps> — canonical progress spine. Drives the LEG3ND learning arc
 * (learn → assess → certify → recert) and any other ordered multi-stage
 * flow. Pairs with <ProgressBar> for percent-complete; this shows the
 * discrete milestones.
 *
 * Token-only: done = accent, current = accent ring, upcoming = muted.
 */
export type StepState = "done" | "current" | "upcoming";

export type Step = {
  label: string;
  description?: string;
  state: StepState;
  icon?: ReactNode;
};

export function Steps({
  steps,
  orientation = "horizontal",
  className,
}: {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const vertical = orientation === "vertical";
  return (
    <ol
      className={[
        "flex",
        vertical ? "flex-col gap-0" : "flex-row items-start gap-0",
        className ?? "",
      ].join(" ")}
      aria-label="Progress"
    >
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const dotColor =
          s.state === "done"
            ? "var(--p-accent)"
            : s.state === "current"
              ? "var(--p-accent)"
              : "var(--p-border)";
        const connectorColor = s.state === "done" ? "var(--p-accent)" : "var(--p-border)";
        return (
          <li
            key={i}
            className={["relative flex", vertical ? "flex-row gap-3 pb-6" : "flex-1 flex-col"].join(" ")}
            aria-current={s.state === "current" ? "step" : undefined}
          >
            <div className={vertical ? "flex flex-col items-center" : "flex items-center"}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{
                  background: s.state === "upcoming" ? "var(--p-surface)" : dotColor,
                  border: `2px solid ${dotColor}`,
                  color: s.state === "upcoming" ? "var(--p-text-3)" : "var(--p-accent-cta-contrast)",
                  boxShadow: s.state === "current" ? "0 0 0 4px color-mix(in srgb, var(--p-accent) 22%, transparent)" : undefined,
                }}
              >
                {s.state === "done" ? <Check size={15} /> : (s.icon ?? i + 1)}
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className={vertical ? "w-0.5 flex-1" : "h-0.5 flex-1"}
                  style={{
                    background: connectorColor,
                    minHeight: vertical ? 20 : undefined,
                    margin: vertical ? "2px 0" : "0 8px",
                  }}
                />
              )}
            </div>
            <div className={vertical ? "pt-0.5" : "mt-2"}>
              <div
                className="text-sm font-medium"
                style={{ color: s.state === "upcoming" ? "var(--p-text-3)" : "var(--p-text-1)" }}
              >
                {s.label}
              </div>
              {s.description && <div className="text-xs text-[var(--p-text-2)]">{s.description}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
