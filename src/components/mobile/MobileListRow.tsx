import Link from "next/link";
import type { ReactNode } from "react";

/**
 * CN-15 — shared list-row primitive for /m card lists.
 *
 * Extracted from the repeated row shape across COMPVSS surfaces
 * (DocsSurface, LearningSurface, DirectorySurface, ...): a `.surface`
 * card with an optional leading icon/avatar slot, a truncating title,
 * a muted meta line, and a trailing badge/timestamp/chevron. Pass
 * `href` to make the whole row a Link. Extra row actions (download
 * links, buttons) go in `children` and render below the main line.
 *
 * Server-component friendly — no client hooks.
 */
export type MobileListRowProps = {
  /** Primary line — truncates. */
  title: ReactNode;
  /** Muted secondary line under the title. */
  meta?: ReactNode;
  /** Leading icon / avatar slot. */
  leading?: ReactNode;
  /** Trailing badge / timestamp / chevron slot. */
  trailing?: ReactNode;
  /** When set, the row renders as a block Link. */
  href?: string;
  /** Optional action row rendered below the main line. */
  children?: ReactNode;
  className?: string;
};

export function MobileListRow({ title, meta, leading, trailing, href, children, className = "" }: MobileListRowProps) {
  const inner = (
    <>
      <div className="flex items-start gap-3">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>
          {meta != null && <div className="mt-0.5 truncate text-xs text-[var(--p-text-2)]">{meta}</div>}
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-1">{trailing}</div>}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`surface press-scale block p-3 ${className}`.trim()}>
        {inner}
      </Link>
    );
  }
  return <div className={`surface p-3 ${className}`.trim()}>{inner}</div>;
}
