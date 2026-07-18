"use client";

import * as React from "react";
import type { Option } from "@/lib/enum-options";

/**
 * OptionSelect — a labeled native `<select>` fed by an `Option[]` sourced from
 * the enum/lookup SSOT (`enumOptions` / `fetchLookupOptions`), for server-form
 * FormData posts. Use this instead of hand-written `<option>` lists so the
 * option domain can never fork from the schema. For controlled/searchable sets
 * use `ui/Select` / `ui/Combobox`. Options should already be ordered
 * (enum-declared order or lookup `sort_order`).
 */
export function OptionSelect({
  label,
  name,
  options,
  defaultValue = "",
  required = false,
  placeholderLabel = "—",
  hint,
  className = "",
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
  /** Shown as the empty first row for optional selects. */
  placeholderLabel?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">{label}</span>
      <select name={name} className="ps-input w-full" defaultValue={defaultValue} required={required}>
        {!required && <option value="">{placeholderLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <span className="mt-1 block text-[11px] text-[var(--p-text-3)]">{hint}</span> : null}
    </label>
  );
}
