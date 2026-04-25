"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { formatDate } from "@/lib/i18n/format";

/**
 * DatePicker — keyboard-first calendar, inline or in a popover.
 * Benchmark: Linear date picker (Stripe's uses a native input; Linear builds
 * a Radix popover with custom calendar).
 *
 * Supports:
 * - Single date selection
 * - Keyboard: arrows navigate days, Enter selects, Esc closes, PgUp/PgDn month
 * - min/max constraints
 * - Controlled (value + onChange) or uncontrolled (defaultValue)
 */
export function DatePicker({
  value,
  onChange,
  defaultValue,
  min,
  max,
  placeholder = "Select date",
  clearable,
  disabled,
  "aria-label": ariaLabel,
  className = "",
}: {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  defaultValue?: Date | null;
  min?: Date;
  max?: Date;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}) {
  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState<Date | null>(defaultValue ?? null);
  const selected = controlled ? (value ?? null) : internal;
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date>(() => selected ?? new Date());

  function commit(d: Date | null) {
    if (!controlled) setInternal(d);
    onChange?.(d);
  }

  const display = selected ? formatDate(selected) : placeholder;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? placeholder}
          className={`input-base focus-ring inline-flex w-full items-center justify-between gap-2 ${className}`}
        >
          <span className={selected ? "" : "text-[var(--text-muted)]"}>{display}</span>
          <Calendar size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-3 shadow-lg"
        >
          <Calendar_
            month={viewMonth}
            onMonthChange={setViewMonth}
            value={selected}
            onSelect={(d) => {
              commit(d);
              setOpen(false);
            }}
            min={min}
            max={max}
          />
          {clearable && selected && (
            <button
              type="button"
              onClick={() => {
                commit(null);
                setOpen(false);
              }}
              className="mt-2 w-full rounded px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function Calendar_({
  month,
  onMonthChange,
  value,
  onSelect,
  min,
  max,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  value: Date | null;
  onSelect: (d: Date) => void;
  min?: Date;
  max?: Date;
}) {
  const [focused, setFocused] = React.useState<Date>(() => value ?? month);

  const days = React.useMemo(() => buildMonth(month), [month]);

  function isDisabled(d: Date) {
    if (min && d < startOfDay(min)) return true;
    if (max && d > startOfDay(max)) return true;
    return false;
  }

  function onKey(e: React.KeyboardEvent) {
    const cur = focused;
    let next: Date | null = null;
    if (e.key === "ArrowLeft") next = addDays(cur, -1);
    else if (e.key === "ArrowRight") next = addDays(cur, 1);
    else if (e.key === "ArrowUp") next = addDays(cur, -7);
    else if (e.key === "ArrowDown") next = addDays(cur, 7);
    else if (e.key === "PageUp") next = addMonths(cur, -1);
    else if (e.key === "PageDown") next = addMonths(cur, 1);
    else if (e.key === "Home") next = new Date(cur.getFullYear(), cur.getMonth(), 1);
    else if (e.key === "End") next = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isDisabled(cur)) onSelect(cur);
      return;
    } else {
      return;
    }
    e.preventDefault();
    setFocused(next);
    if (next.getMonth() !== month.getMonth()) onMonthChange(new Date(next.getFullYear(), next.getMonth(), 1));
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month);
  const weekdayLabels = React.useMemo(() => {
    const base = new Date(2024, 0, 7); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(base, i);
      return new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(d);
    });
  }, []);

  return (
    <div role="application" onKeyDown={onKey} className="w-64">
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="rounded p-1 hover:bg-[var(--surface-inset)]"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="text-sm font-medium">{monthLabel}</div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="rounded p-1 hover:bg-[var(--surface-inset)]"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase text-[var(--text-muted)]">
        {weekdayLabels.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div role="grid" className="mt-1 grid grid-cols-7 gap-0.5">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month.getMonth();
          const isSelected = value && sameDay(d, value);
          const isFocused = sameDay(d, focused);
          const isToday = sameDay(d, new Date());
          const dis = isDisabled(d);
          return (
            <button
              key={i}
              type="button"
              tabIndex={isFocused ? 0 : -1}
              aria-pressed={isSelected ? "true" : "false"}
              aria-label={formatDate(d)}
              disabled={dis}
              onFocus={() => setFocused(d)}
              onClick={() => !dis && onSelect(d)}
              className={`relative rounded px-0 py-1.5 text-xs transition-colors ${
                isSelected
                  ? "bg-[var(--org-primary)] font-medium text-white"
                  : inMonth
                    ? "text-[var(--text-primary)] hover:bg-[var(--surface-inset)]"
                    : "text-[var(--text-muted)] opacity-50 hover:bg-[var(--surface-inset)]"
              } ${dis ? "pointer-events-none opacity-30" : ""} ${
                isToday && !isSelected ? "ring-1 ring-[var(--org-primary)]/40" : ""
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * RangeDatePicker — pick a [from, to] window with quick presets. Stripe,
 * Linear, and Ramp surface "Today / This Week / Last 30 days" so the
 * common case is one click. The custom range still uses the same
 * keyboard-first calendar as DatePicker.
 */
export type DateRange = { from: Date | null; to: Date | null };

const RANGE_PRESETS: { label: string; compute: () => DateRange }[] = [
  { label: "Today", compute: () => { const t = startOfDay(new Date()); return { from: t, to: t }; } },
  { label: "Yesterday", compute: () => { const y = startOfDay(addDays(new Date(), -1)); return { from: y, to: y }; } },
  { label: "Last 7 days", compute: () => ({ from: startOfDay(addDays(new Date(), -6)), to: startOfDay(new Date()) }) },
  { label: "Last 30 days", compute: () => ({ from: startOfDay(addDays(new Date(), -29)), to: startOfDay(new Date()) }) },
  { label: "This month", compute: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1), to: startOfDay(n) }; } },
  { label: "Last month", compute: () => { const n = new Date(); const start = new Date(n.getFullYear(), n.getMonth() - 1, 1); const end = new Date(n.getFullYear(), n.getMonth(), 0); return { from: start, to: end }; } },
];

export function RangeDatePicker({
  value,
  onChange,
  placeholder = "Select range",
  className = "",
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pickingEnd, setPickingEnd] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date>(() => value.from ?? new Date());

  const display = value.from && value.to
    ? `${formatDate(value.from)} – ${formatDate(value.to)}`
    : value.from
      ? `${formatDate(value.from)} – …`
      : placeholder;

  function onSelect(d: Date) {
    if (!pickingEnd) {
      onChange({ from: d, to: null });
      setPickingEnd(true);
      return;
    }
    const from = value.from!;
    const ordered = d < from ? { from: d, to: from } : { from, to: d };
    onChange(ordered);
    setPickingEnd(false);
    setOpen(false);
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={placeholder}
          className={`input-base focus-ring inline-flex w-full items-center justify-between gap-2 ${className}`}
        >
          <span className={value.from ? "" : "text-[var(--text-muted)]"}>{display}</span>
          <Calendar size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 flex gap-3 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] p-3 shadow-lg"
        >
          <div className="flex w-32 flex-col gap-0.5 border-e border-[var(--border-color)] pe-3 text-xs">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.compute());
                  setPickingEnd(false);
                  setOpen(false);
                }}
                className="rounded px-2 py-1 text-start text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar_
            month={viewMonth}
            onMonthChange={setViewMonth}
            value={pickingEnd ? null : value.from}
            onSelect={onSelect}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ─── date helpers (local-timezone) ─────────────────────────────────────

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}
function buildMonth(month: Date): Date[] {
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = firstOfMonth.getDay(); // 0-Sun to 6-Sat
  const start = addDays(firstOfMonth, -startOffset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
