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
  className?: string;
};

export function Divider({ orientation = "horizontal", label, className = "" }: DividerProps) {
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
        <span className="text-xs font-medium tracking-[0.04em]">{label}</span>
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
