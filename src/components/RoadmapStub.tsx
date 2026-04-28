import Link from "next/link";
import type { ReactNode } from "react";

type RoadmapStubProps = {
  title: string;
  /** What this surface will eventually do, in operator language. */
  description: string;
  /**
   * Where to send the operator in the meantime — usually a nearby implemented
   * surface that already covers part of the same workflow.
   */
  inTheMeantime?: { href: string; label: string };
  /**
   * Optional sub-bullets to give a sharper picture of what's coming. Keep
   * each ≤ 60 chars.
   */
  capabilities?: string[];
  /** Optional footer content (custom CTAs, embeds). */
  children?: ReactNode;
};

/**
 * Standard placeholder for surfaces that are scoped but not yet implemented.
 * Replaces the inconsistent ad-hoc "Coming in v0.2" cards. One canonical look.
 */
export function RoadmapStub({ title, description, inTheMeantime, capabilities, children }: RoadmapStubProps) {
  return (
    <div className="surface max-w-2xl p-6">
      <div className="text-xs font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">On the roadmap</div>
      <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
      {capabilities && capabilities.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm text-[var(--text-secondary)]">
          {capabilities.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-[var(--text-muted)]" aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}
      {inTheMeantime && (
        <div className="mt-5 border-t border-[var(--border-color)] pt-4 text-sm">
          <span className="text-[var(--text-muted)]">In the meantime: </span>
          <Link href={inTheMeantime.href} className="text-[var(--org-primary)] hover:underline">
            {inTheMeantime.label} →
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
