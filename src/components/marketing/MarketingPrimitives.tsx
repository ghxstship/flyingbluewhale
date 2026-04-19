import * as React from "react";

/**
 * Canonical marketing layout primitives — M2-02 / M2-07.
 *
 * The 12 marketing pages were each hand-rolled. Hero `h1` sizes ranged
 * from `text-4xl` (features) to `text-7xl` (home); section spacing was
 * `mt-12`, `py-16`, `pt-20`, whatever shipped first. These primitives
 * define one canonical scale so every page inherits the same visual
 * rhythm.
 *
 * Rules locked by the primitives (not enforced by eslint — by convention):
 *   - Hero h1 = `text-5xl sm:text-6xl lg:text-7xl` with `leading-[1.05]`.
 *   - Section h2 = `text-3xl sm:text-4xl` with `tracking-tight`.
 *   - Sections stack with `space-y-6` inside, and pages stack sections
 *     with `space-y-20 md:space-y-28`.
 *   - Max content width is the shared `max-w-6xl` band, centered.
 *
 * Focus ring (M2-07): all interactive children inherit globals.css'
 * `a:focus-visible, button:focus-visible` rule, so no per-primitive
 * focus styling is required. Primitives DO apply `focus-visible:ring-2
 * ring-offset-2 ring-[var(--accent)]` on their own clickable surfaces.
 */

// ---------------------------------------------------------------------------
// MarketingHero — the above-the-fold heading + subtitle + CTA cluster.
// ---------------------------------------------------------------------------
export function MarketingHero({
  eyebrow,
  title,
  subtitle,
  actions,
  className = "",
}: {
  /** Small label above the title; often a badge. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** CTA buttons / links. Rendered in a horizontal flex row on >= sm. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-6xl px-6 py-16 md:py-24 ${className}`}>
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-solid,var(--org-primary))]">
          {eyebrow}
        </div>
      )}
      <h1
        className={`${eyebrow ? "mt-3" : ""} max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl`}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-5 max-w-2xl text-pretty text-lg text-[var(--text-secondary)]">
          {subtitle}
        </p>
      )}
      {actions && (
        <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// MarketingSection — every non-hero block on a marketing page.
// ---------------------------------------------------------------------------
export function MarketingSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
  align = "start",
  "aria-label": ariaLabel,
}: {
  id?: string;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center";
  "aria-label"?: string;
}) {
  const alignClass = align === "center" ? "text-center" : "";
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`mx-auto max-w-6xl px-6 py-16 md:py-20 ${className}`}
    >
      {(eyebrow || title || subtitle) && (
        <header className={`mb-10 ${alignClass}`}>
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-solid,var(--org-primary))]">
              {eyebrow}
            </div>
          )}
          {title && (
            <h2 className={`${eyebrow ? "mt-3" : ""} max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl ${align === "center" ? "mx-auto" : ""}`}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={`mt-3 max-w-2xl text-[var(--text-secondary)] ${align === "center" ? "mx-auto" : ""}`}>
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// MarketingGrid — consistent responsive card grid inside sections.
// Default is 3-up on lg, 2-up on md, stacked on mobile.
// ---------------------------------------------------------------------------
export function MarketingGrid({
  cols = 3,
  children,
  className = "",
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}) {
  const gridCols =
    cols === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : cols === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid gap-5 ${gridCols} ${className}`}>{children}</div>;
}

// ---------------------------------------------------------------------------
// MarketingPageShell — stacks a hero + N sections with canonical rhythm.
// Purely a layout convenience; the h1 / h2 styling lives on the primitives.
// ---------------------------------------------------------------------------
export function MarketingPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="space-y-6 md:space-y-10 lg:space-y-14 pb-24">{children}</main>
  );
}
