import type { ReactNode } from "react";

/** A single term/description pair rendered as a `<dt>`/`<dd>`. */
export type DescriptionItem = {
  term: ReactNode;
  description: ReactNode;
};

export type DescriptionListProps = {
  items: DescriptionItem[];
  /**
   * Number of columns on wide viewports. Each column holds a stacked
   * term-over-description pair. Stacks to a single column under `sm`.
   * Defaults to 2.
   */
  columns?: 1 | 2 | 3;
  className?: string;
};

const COLS: Record<NonNullable<DescriptionListProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * DescriptionList — a semantic `<dl>` for key/value metadata blocks (record
 * detail panels, settings summaries). Renders a responsive grid of stacked
 * term-over-description pairs that collapses to one column under `sm`.
 *
 * The term is a muted Space-Mono-flavoured label; the description sits in the
 * primary text color. All colors come from `--p-*` tokens.
 */
export function DescriptionList({ items, columns = 2, className = "" }: DescriptionListProps) {
  return (
    <dl className={`grid gap-x-[var(--p-6)] gap-y-[var(--p-4)] ${COLS[columns]} ${className}`.trim()}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-[var(--p-1)]">
          <dt className="text-[11px] font-medium tracking-[0.04em] text-[var(--p-text-2)] uppercase">
            {item.term}
          </dt>
          <dd className="text-sm text-[var(--p-text-1)]">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
