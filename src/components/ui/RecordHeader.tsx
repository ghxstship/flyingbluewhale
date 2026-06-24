import type { CSSProperties, ReactNode } from "react";

/**
 * RecordHeader — the title block for a detail page (a single record:
 * project, invoice, person, …). Mirrors `ModuleHeader` spacing but leads
 * with an Anton display title (the `--p-heading` family, ALL-CAPS via
 * `--p-display-case`) and supports a row of meta chips under the title.
 *
 * Layout: optional breadcrumb slot → eyebrow → title → subtitle → meta
 * chips, with a right-aligned `actions` slot vertically aligned to the top.
 * All colors/spacing come from `--p-*` tokens.
 */
export type RecordHeaderProps = {
  /** Record title — rendered in the Anton display face. */
  title: ReactNode;
  /** Small uppercase mono eyebrow above the title (e.g. record type / ID). */
  eyebrow?: ReactNode;
  /** Supporting line under the title. */
  subtitle?: ReactNode;
  /** Optional breadcrumb trail rendered above the header (pass a `<Breadcrumbs>`). */
  breadcrumb?: ReactNode;
  /**
   * Meta chips row — status badges, dates, owners. Rendered as a wrapping
   * flex row beneath the subtitle. Pass `<Badge>`s, `<StatusBadge>`s, etc.
   */
  meta?: ReactNode;
  /** Right-aligned action slot (button cluster). */
  actions?: ReactNode;
  className?: string;
};

export function RecordHeader({
  title,
  eyebrow,
  subtitle,
  breadcrumb,
  meta,
  actions,
  className = "",
}: RecordHeaderProps) {
  return (
    <header className={`border-b border-[var(--p-border)] px-[var(--p-6)] py-[var(--p-5)] ${className}`.trim()}>
      {breadcrumb && <div className="mb-[var(--p-2)]">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-[var(--p-4)]">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="font-mono text-[11px] font-semibold tracking-[0.14em] text-[var(--p-accent)] uppercase">
              {eyebrow}
            </div>
          )}
          <h1
            className="mt-[var(--p-1)] truncate text-2xl text-[var(--p-text-1)]"
            style={{
              fontFamily: "var(--p-heading)",
              fontWeight: "var(--p-heading-weight)" as CSSProperties["fontWeight"],
              letterSpacing: "var(--p-heading-ls)",
              textTransform: "var(--p-display-case)" as CSSProperties["textTransform"],
            }}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-[var(--p-1)] text-sm text-[var(--p-text-2)]">{subtitle}</p>}
          {meta && <div className="mt-[var(--p-3)] flex flex-wrap items-center gap-[var(--p-2)]">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-[var(--p-2)]">{actions}</div>}
      </div>
    </header>
  );
}
