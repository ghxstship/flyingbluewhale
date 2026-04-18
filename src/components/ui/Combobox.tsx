"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";

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
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results",
  className = "",
}: {
  options: ComboboxOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={`input-base focus-ring inline-flex w-full items-center justify-between gap-2 ${className}`}
        >
          <span className={selected ? "" : "text-[var(--text-muted)]"}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] shadow-lg"
        >
          <CommandPrimitive className="flex flex-col">
            <div className="border-b border-[var(--border-color)] px-3 py-2">
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
            <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1">
              <CommandPrimitive.Empty className="py-6 text-center text-xs text-[var(--text-muted)]">
                {emptyLabel}
              </CommandPrimitive.Empty>
              {options.map((o) => (
                <CommandPrimitive.Item
                  key={o.value}
                  value={`${o.label} ${(o.keywords ?? []).join(" ")}`}
                  disabled={o.disabled}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm data-[disabled=true]:opacity-50 data-[selected=true]:bg-[var(--surface-inset)]"
                >
                  <Check
                    size={12}
                    className={value === o.value ? "text-[var(--org-primary)]" : "opacity-0"}
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
}: {
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedSet = new Set(value);
  const selectedLabels = options.filter((o) => selectedSet.has(o.value)).map((o) => o.label);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          className={`input-base focus-ring inline-flex w-full items-center justify-between gap-2 ${className}`}
        >
          <span className={selectedLabels.length ? "" : "text-[var(--text-muted)]"}>
            {selectedLabels.length ? `${selectedLabels.length} selected` : placeholder}
          </span>
          <ChevronsUpDown size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] shadow-lg"
        >
          <CommandPrimitive>
            <div className="border-b border-[var(--border-color)] px-3 py-2">
              <CommandPrimitive.Input
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
            <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1">
              <CommandPrimitive.Empty className="py-6 text-center text-xs text-[var(--text-muted)]">
                {emptyLabel}
              </CommandPrimitive.Empty>
              {options.map((o) => {
                const checked = selectedSet.has(o.value);
                return (
                  <CommandPrimitive.Item
                    key={o.value}
                    value={`${o.label} ${(o.keywords ?? []).join(" ")}`}
                    disabled={o.disabled}
                    onSelect={() => {
                      const next = checked ? value.filter((v) => v !== o.value) : [...value, o.value];
                      onChange(next);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm data-[disabled=true]:opacity-50 data-[selected=true]:bg-[var(--surface-inset)]"
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-[var(--org-primary)] bg-[var(--org-primary)] text-white"
                          : "border-[var(--border-color)]"
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
