import type { ReactNode } from "react";

/**
 * Divider — a thematic separator painted from `--p-border`.
 *
 * - `orientation="horizontal"` (default): a full-width rule. With a `label`
 *   it becomes a centered captioned divider (rule · label · rule).
 * - `orientation="vertical"`: a self-stretching hairline for inline groups
 *   (toolbars, button rows). Give the parent a height; the divider fills it.
 *
 * Semantics follow the WAI-ARIA `separator` role: a labelled horizontal
 * divider is still a separator (the label is the accessible name), and the
 * `aria-orientation` is always set so AT announce the axis.
 */
export type DividerProps = {
  /** Layout axis. Defaults to `horizontal`. */
  orientation?: "horizontal" | "vertical";
  /** Optional centered caption (horizontal only). Ignored when vertical. */
  label?: ReactNode;
  /**
   * Caption treatment (horizontal + `label` only).
   * - `caption` (default): small medium-weight text.
   * - `eyebrow`: uppercase letterspaced micro-caption — the auth-shell
   *   "or continue with email" treatment (absorbed from the retired
   *   AuthDivider, W5 2026-07-22).
   */
  labelStyle?: "caption" | "eyebrow";
  className?: string;
};

const LABEL_STYLES: Record<NonNullable<DividerProps["labelStyle"]>, string> = {
  caption: "text-xs font-medium tracking-[0.04em]",
  eyebrow: "text-[11px] tracking-[0.2em] uppercase",
};

export function Divider({ orientation = "horizontal", label, labelStyle = "caption", className = "" }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`inline-block w-px self-stretch bg-[var(--p-border)] ${className}`.trim()}
      />
    );
  }

  if (label != null && label !== "") {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={`flex items-center gap-[var(--p-3)] text-[var(--p-text-2)] ${className}`.trim()}
      >
        <span className="h-px flex-1 bg-[var(--p-border)]" aria-hidden="true" />
        <span className={LABEL_STYLES[labelStyle]}>{label}</span>
        <span className="h-px flex-1 bg-[var(--p-border)]" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={`h-px w-full bg-[var(--p-border)] ${className}`.trim()}
    />
  );
}
