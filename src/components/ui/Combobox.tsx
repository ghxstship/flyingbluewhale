"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Spinner } from "./Spinner";

/**
 * Combobox — searchable single-select.
 * Built on cmdk (fuzzy-search, keyboard-first) + Radix Popover.
 *
 * Usage:
 *   <Combobox options={[{ value: "1", label: "One" }]} value={v} onChange={setV} />
 */

export type ComboboxOption = {
  value: string;
  label: string;
  keywords?: string[];
  disabled?: boolean;
};

export function Combobox({
  options: staticOptions,
  optionsLoader,
  loaderDebounceMs = 200,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results",
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  options?: ComboboxOption[];
  /** Async option loader. Takes the current search query and returns options.
   *  Use over `options` when the candidate set is large (>500) or
   *  server-resident (user picker, location lookup, vendor search). */
  optionsLoader?: (query: string) => Promise<ComboboxOption[]>;
  loaderDebounceMs?: number;
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  /** Accessible name for the combobox trigger (AX-10). Without one the
   *  trigger's name falls back to its visible text content. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [asyncOptions, setAsyncOptions] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [lastSelectedLabel, setLastSelectedLabel] = React.useState<string | undefined>(undefined);
  const listboxId = React.useId();
  // PF-8 — request sequence token. The loader is debounced, but a slow
  // earlier response could still resolve after a faster later one and
  // clobber the option list; only the latest issued request may commit.
  const loadSeqRef = React.useRef(0);

  // Debounced async load.
  React.useEffect(() => {
    if (!optionsLoader || !open) return;
    setLoading(true);
    const seq = ++loadSeqRef.current;
    const handle = setTimeout(async () => {
      try {
        const next = await optionsLoader(query);
        if (seq === loadSeqRef.current) setAsyncOptions(next);
      } finally {
        if (seq === loadSeqRef.current) setLoading(false);
      }
    }, loaderDebounceMs);
    return () => clearTimeout(handle);
  }, [optionsLoader, query, open, loaderDebounceMs]);

  const options = optionsLoader ? asyncOptions : (staticOptions ?? []);
  const selected = options.find((o) => o.value === value);
  // Remember the last-known label for the selected value across refreshes
  // of the async option set (otherwise the trigger flickers to placeholder
  // when the popover closes).
  React.useEffect(() => {
    if (selected) setLastSelectedLabel(selected.label);
  }, [selected]);
  const selectedLabel = selected?.label ?? lastSelectedLabel;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={`ps-input focus-ring inline-flex w-full items-center justify-between gap-2 ${className}`}
        >
          <span className={selectedLabel ? "" : "text-[var(--p-text-2)]"}>{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown size={12} className="text-[var(--p-text-2)]" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[var(--p-z-popover)] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-[var(--p-border)] bg-[var(--p-surface)]"
        >
          {/* shouldFilter=false when async, so cmdk doesn't strip server results */}
          <CommandPrimitive className="flex flex-col" shouldFilter={!optionsLoader}>
            <div className="flex items-center gap-2 border-b border-[var(--p-border)] px-3 py-2">
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                value={query}
                onValueChange={setQuery}
                className="focus-ring w-full rounded bg-transparent text-sm placeholder:text-[var(--p-text-2)]"
              />
              {loading && <Spinner size="sm" className="shrink-0 text-[var(--p-text-2)]" />}
            </div>
            {/* AX-10 — aria-controls on the trigger points here (the actual
                cmdk listbox), not the popover wrapper. */}
            <CommandPrimitive.List id={listboxId} className="max-h-60 overflow-y-auto p-1">
              <CommandPrimitive.Empty className="py-6 text-center text-xs text-[var(--p-text-2)]">
                {loading ? "Loading…" : emptyLabel}
              </CommandPrimitive.Empty>
              {options.map((o) => (
                <CommandPrimitive.Item
                  key={o.value}
                  value={`${o.label} ${(o.keywords ?? []).join(" ")}`}
                  disabled={o.disabled}
                  onSelect={() => {
                    onChange(o.value);
                    setLastSelectedLabel(o.label);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm data-[disabled=true]:opacity-50 data-[selected=true]:bg-[var(--p-surface-2)]"
                >
                  <Check
                    size={12}
                    className={value === o.value ? "text-[var(--p-accent)]" : "opacity-0"}
                    aria-hidden="true"
                  />
                  <span>{o.label}</span>
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function MultiCombobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results",
  className = "",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  /** Accessible name for the combobox trigger (AX-10). Without one the
   *  trigger's name falls back to its visible text content. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const listboxId = React.useId();
  const selectedSet = new Set(value);
  const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={`ps-input focus-ring inline-flex w-full items-center justify-between gap-2 ${className}`}
        >
          <span className={selectedLabels.length ? "" : "text-[var(--p-text-2)]"}>
            {selectedLabels.length ? `${selectedLabels.length} selected` : placeholder}
          </span>
          <ChevronsUpDown size={12} className="text-[var(--p-text-2)]" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-[var(--p-z-popover)] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-[var(--p-border)] bg-[var(--p-surface)]"
        >
          <CommandPrimitive>
            <div className="border-b border-[var(--p-border)] px-3 py-2">
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                className="focus-ring w-full rounded bg-transparent text-sm placeholder:text-[var(--p-text-2)]"
              />
            </div>
            {/* AX-10/AX-11 — aria-controls targets this listbox; selection is
                conveyed programmatically via aria-multiselectable +
                per-option aria-checked, not just the aria-hidden checkbox
                visual. */}
            <CommandPrimitive.List id={listboxId} aria-multiselectable="true" className="max-h-60 overflow-y-auto p-1">
              <CommandPrimitive.Empty className="py-6 text-center text-xs text-[var(--p-text-2)]">
                {emptyLabel}
              </CommandPrimitive.Empty>
              {options.map((o) => {
                const checked = selectedSet.has(o.value);
                return (
                  <CommandPrimitive.Item
                    key={o.value}
                    value={`${o.label} ${(o.keywords ?? []).join(" ")}`}
                    disabled={o.disabled}
                    aria-checked={checked}
                    onSelect={() => {
                      const next = checked ? value.filter((v) => v !== o.value) : [...value, o.value];
                      onChange(next);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm data-[disabled=true]:opacity-50 data-[selected=true]:bg-[var(--p-surface-2)]"
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-white"
                          : "border-[var(--p-border)]"
                      }`}
                      aria-hidden="true"
                    >
                      {checked && <Check size={10} strokeWidth={3} />}
                    </span>
                    <span>{o.label}</span>
                  </CommandPrimitive.Item>
                );
              })}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
