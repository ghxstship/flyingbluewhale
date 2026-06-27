import Link from "next/link";
import type { ReactNode } from "react";

/**
 * ListRow — the generic track/list row that media + identity lists compose.
 * Leading slot (avatar / thumbnail / index number), primary + secondary text,
 * trailing meta + actions. Supports hover and selectable (`aria-selected`)
 * variants. Becomes keyboard-accessible when `href` or `onClick` is provided.
 *
 * Colors read only from `--p-*` tokens; focus via `.focus-ring`. The actions
 * slot stops click propagation so it doesn't trigger the row.
 */
export type ListRowProps = {
  /** Leading visual: an <Avatar>, thumbnail, or index node. */
  leading?: ReactNode;
  /** Convenience: render a monospaced index number as the leading slot. */
  index?: number;
  primary: ReactNode;
  secondary?: ReactNode;
  /** Trailing meta text/badge shown before the actions slot. */
  meta?: ReactNode;
  /** Trailing action controls (play, menu). Clicks here don't trigger the row. */
  actions?: ReactNode;
  /** Selectable variant: sets `aria-selected` and a token-tinted active fill. */
  selected?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

function Leading({ leading, index }: Pick<ListRowProps, "leading" | "index">) {
  if (leading) return <div className="shrink-0">{leading}</div>;
  if (index != null) {
    return (
      <div className="w-6 shrink-0 text-end font-[family-name:var(--p-mono-data,var(--p-mono))] text-sm text-[var(--p-text-3)] tabular-nums">
        {index}
      </div>
    );
  }
  return null;
}

export function ListRow({
  leading,
  index,
  primary,
  secondary,
  meta,
  actions,
  selected,
  href,
  onClick,
  className = "",
  ...props
}: ListRowProps) {
  const isInteractive = !!href || !!onClick;
  const base =
    "group flex w-full items-center gap-3 rounded-[var(--p-r,8px)] px-3 py-2 text-start transition-colors";
  const selectedCls = selected ? "bg-[var(--p-surface-2)]" : "";
  const interactive = isInteractive
    ? "focus-ring outline-none cursor-pointer hover:bg-[var(--p-surface-2)]"
    : "";
  const cls = `${base} ${selectedCls} ${interactive} ${className}`.trim();

  const inner = (
    <>
      <Leading leading={leading} index={index} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--p-text-1)]">{primary}</div>
        {secondary && <div className="truncate text-xs text-[var(--p-text-2)]">{secondary}</div>}
      </div>
      {meta && <div className="shrink-0 text-xs text-[var(--p-text-2)]">{meta}</div>}
      {actions && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- wrapper only stops the row's click/keydown from firing; the action children carry their own semantics.
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        aria-label={props["aria-label"]}
        aria-current={selected ? "true" : undefined}
      >
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cls}
        aria-label={props["aria-label"]}
        aria-pressed={selected}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} aria-selected={selected ? true : undefined}>
      {inner}
    </div>
  );
}
