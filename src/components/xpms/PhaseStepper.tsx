/**
 * PhaseStepper — the 8-phase XPMS time-axis chrome (ADR-0004 Axis B).
 *
 * Renders the eight production phases (Discovery → Wrap) as a horizontal
 * stepper, with the active project's phase highlighted. Click a phase to
 * scope subsequent navigation (deep-link query param `?phase=`).
 *
 * Server component — pure data, no hooks. The parent (project layout
 * or platform layout) resolves the active project's `xpms_phase` and
 * passes it in via `currentPhase`. When no project is selected the
 * stepper renders inactive (no fill, all phases muted).
 *
 * Phase data comes from src/lib/xpms/index.ts XPMS_PHASES — order is
 * authoritative per the whitepaper §9.
 */

import Link from "next/link";
import { XPMS_PHASES, type XpmsPhase } from "@/lib/xpms";

type Props = {
  /** Current phase of the active project. When undefined the stepper is
   *  inactive (no phase highlighted, no link target — display-only). */
  currentPhase?: XpmsPhase | null;
  /** Project id used to deep-link into phase-scoped views. When provided
   *  each phase becomes a link to `/studio/projects/{id}?phase={id}`.
   *  When omitted the stepper renders as static display chrome. */
  projectId?: string;
  /** Compact mode hides phase labels, keeping only the numbered dots.
   *  Useful when the parent layout has tight vertical room. */
  compact?: boolean;
  /** Override the default route prefix. Defaults to /studio/projects.
   *  Pass when mounting the stepper outside the project shell. */
  hrefBase?: string;
};

export function PhaseStepper({ currentPhase, projectId, compact = false, hrefBase }: Props) {
  const currentIndex = currentPhase ? XPMS_PHASES.findIndex((p) => p.id === currentPhase) : -1;

  return (
    <nav
      aria-label="XPMS production phase"
      data-active-phase={currentPhase ?? "none"}
      className="flex w-full items-center gap-1 border-b border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-xs"
    >
      <ol className="flex w-full items-center justify-between gap-1">
        {XPMS_PHASES.map((phase, idx) => {
          const isCurrent = phase.id === currentPhase;
          const isPast = currentIndex >= 0 && idx < currentIndex;
          const isFuture = currentIndex >= 0 && idx > currentIndex;
          const stateClass = isCurrent
            ? "text-[var(--p-text-1)] font-medium"
            : isPast
              ? "text-[var(--p-text-2)]"
              : isFuture
                ? "text-[var(--p-text-2)] opacity-60"
                : "text-[var(--p-text-2)]";

          const dotClass = isCurrent
            ? "bg-[var(--p-accent)] text-white"
            : isPast
              ? "bg-[var(--p-text-2)] text-[var(--p-surface)]"
              : "bg-[var(--p-surface-2)] text-[var(--p-text-2)]";

          const inner = (
            <span className={`flex items-center gap-1.5 ${stateClass}`}>
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${dotClass}`}
              >
                {phase.num}
              </span>
              {!compact && <span className="truncate">{phase.label}</span>}
            </span>
          );

          // Link only when projectId is supplied AND the phase is not
          // currently selected. Self-links would refresh-loop on click.
          const canLink = projectId && !isCurrent;
          const href = canLink ? `${hrefBase ?? "/studio/projects"}/${projectId}?phase=${phase.id}` : undefined;

          return (
            <li key={phase.id} className="flex min-w-0 flex-1 items-center gap-1">
              {href ? (
                <Link
                  href={href}
                  className="flex min-w-0 items-center rounded px-1 py-0.5 hover:bg-[var(--p-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Phase ${phase.num}: ${phase.label}`}
                >
                  {inner}
                </Link>
              ) : (
                <span
                  className="flex min-w-0 items-center px-1 py-0.5"
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Phase ${phase.num}: ${phase.label}`}
                >
                  {inner}
                </span>
              )}
              {idx < XPMS_PHASES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 ${isPast || isCurrent ? "bg-[var(--p-text-2)]" : "bg-[var(--p-border)]"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
