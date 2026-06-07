import type { ButtonHTMLAttributes, ReactNode } from "react";

export type SelectableCardTone = "brand" | "success" | "error";

export interface SelectableCardProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onChange" | "title" | "role"
> {
  selected: boolean;
  /** Visual tint when selected. Defaults to `brand` (--p-accent). */
  tone?: SelectableCardTone;
  /** ARIA semantic — `radio` for "one of N", `checkbox` for "any of N".
   *  Defaults to `radio`. The wrapping element should set `role="radiogroup"`
   *  or `role="group"` accordingly. */
  selectionRole?: "radio" | "checkbox";
  /** Bold first line. */
  title: ReactNode;
  /** Optional supporting copy below the title. */
  description?: ReactNode;
  /** Optional leading element (icon, checkbox indicator, etc.). */
  leading?: ReactNode;
  /** Optional trailing element (price, badge, etc.). */
  trailing?: ReactNode;
}

const TONE_SELECTED: Record<SelectableCardTone, string> = {
  brand: "border-[var(--p-accent)] bg-[color-mix(in_srgb,var(--p-accent)_8%,transparent)]",
  success: "border-[color:var(--p-success)] bg-[color-mix(in_srgb,var(--p-success)_10%,transparent)]",
  error: "border-[color:var(--p-danger)] bg-[color-mix(in_srgb,var(--p-danger)_10%,transparent)]",
};

/**
 * Selectable card — bordered toggle for "pick one of N" UIs (decision
 * cards, add-on rows, plan tiers). Button under the hood for keyboard
 * semantics + the global focus ring. Caller manages selection state.
 *
 * Defaults to a brand-tinted selected state. Pass `tone="success" | "error"`
 * for approve/reject decision rows.
 */
export function SelectableCard({
  selected,
  tone = "brand",
  selectionRole = "radio",
  title,
  description,
  leading,
  trailing,
  className = "",
  ...rest
}: SelectableCardProps) {
  const base =
    "flex w-full items-start justify-between gap-3 rounded-md border-2 p-4 text-start transition-colors press-scale";
  const stateCls = selected ? TONE_SELECTED[tone] : "border-[var(--p-border)] hover:border-[var(--p-text-2)]";

  return (
    <button
      type="button"
      role={selectionRole}
      aria-checked={selected}
      data-selected={selected || undefined}
      className={`${base} ${stateCls} ${className}`.trim()}
      {...rest}
    >
      <span className="flex flex-1 items-start gap-3">
        {leading && <span className="shrink-0">{leading}</span>}
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{title}</span>
          {description && <span className="text-xs text-[var(--p-text-2)]">{description}</span>}
        </span>
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </button>
  );
}
