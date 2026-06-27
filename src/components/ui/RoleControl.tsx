"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";

/**
 * RoleControl — a labeled, accessible control for picking a role/permission
 * from a fixed set. Wraps the Radix-backed `<Select>` (combobox/listbox
 * semantics, keyboard + screen-reader support) and adds a `<label>`, optional
 * helper text, and an optional permission summary derived from the selected
 * role's `description`.
 *
 * Colors read only from `--p-*` tokens (inherited from the Select primitive);
 * focus via the Select trigger's `.focus-ring`.
 */
export type RoleOption = {
  value: string;
  label: string;
  /** Optional human-readable summary of what the role can do. */
  description?: string;
};

export type RoleControlProps = {
  roles: RoleOption[];
  value?: string;
  onChange: (value: string) => void;
  /** Visible field label. */
  label: string;
  /** Helper text under the control. */
  hint?: string;
  /** Show the selected role's description as a permission summary. Default true. */
  showSummary?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function RoleControl({
  roles,
  value,
  onChange,
  label,
  hint,
  showSummary = true,
  placeholder = "Select a role…",
  disabled,
  className = "",
}: RoleControlProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const summaryId = `${id}-summary`;
  const selected = roles.find((r) => r.value === value);
  const describedBy = [hint ? hintId : null, showSummary && selected?.description ? summaryId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <label
        id={labelId}
        className="font-[family-name:var(--p-mono)] text-[10px] font-semibold tracking-wide text-[var(--p-text-2)] uppercase"
      >
        {label}
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-labelledby={labelId} aria-describedby={describedBy || undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && (
        <p id={hintId} className="text-xs text-[var(--p-text-3)]">
          {hint}
        </p>
      )}
      {showSummary && selected?.description && (
        <p id={summaryId} className="text-xs text-[var(--p-text-2)]">
          {selected.description}
        </p>
      )}
    </div>
  );
}
