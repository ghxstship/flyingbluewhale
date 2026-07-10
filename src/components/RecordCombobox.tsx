"use client";

import * as React from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { searchOrgRecords, type RecordSearchTable } from "./record-search";

/**
 * RecordCombobox — async searchable FK picker for server-component forms
 * (audit A-06). Drop-in replacement for the capped `<select name=…>` FK
 * pattern: renders a hidden input carrying the selected id (so plain
 * FormShell posts keep working) and searches the target table server-side
 * through `searchOrgRecords` — rows past any list cap stay findable.
 *
 * Usage:
 *   <RecordCombobox table="clients" name="client_id" label="Client"
 *     noneLabel="No client" defaultValue={id} defaultLabel={name} />
 */
export function RecordCombobox({
  table,
  name,
  label,
  defaultValue,
  defaultLabel,
  noneLabel,
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  emptyLabel = "No matches",
  onValueChange,
  className = "",
}: {
  /** Allow-listed search target — see `record-search.ts`. */
  table: RecordSearchTable;
  /** Form field name for the hidden input (e.g. "client_id"). */
  name: string;
  /** Visible field label. */
  label: string;
  /** Pre-selected record id (e.g. from a `?clientId=` deep link). */
  defaultValue?: string;
  /** Display label for `defaultValue` — resolve it server-side and pass it
   *  through so the trigger reads the record name before the first search. */
  defaultLabel?: string;
  /** When set, the field is clearable: a "none" option with value "" is
   *  offered at the top of the unfiltered list. */
  noneLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Observe selection changes (e.g. to scope a dependent picker). */
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = React.useState(defaultValue ?? "");
  const labelId = React.useId();

  const loader = React.useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      const options = await searchOrgRecords(table, query);
      // Clearable fields surface the none option on the unfiltered list.
      if (noneLabel && !query.trim()) return [{ value: "", label: noneLabel }, ...options];
      return options;
    },
    [table, noneLabel],
  );

  const handleChange = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  // Before the first search resolves, the Combobox has no option list to
  // read the selected label from — surface the server-resolved default
  // label (or the none label) through the placeholder so the trigger never
  // shows a bare "Select…" over a real selection.
  const restingPlaceholder =
    value && value === defaultValue && defaultLabel ? defaultLabel : !value && noneLabel ? noneLabel : placeholder;

  return (
    <div className={className}>
      <label id={labelId} className="text-xs font-medium text-[var(--p-text-2)]">
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <div className="mt-1.5">
        <Combobox
          optionsLoader={loader}
          value={value}
          onChange={handleChange}
          placeholder={restingPlaceholder}
          searchPlaceholder={searchPlaceholder}
          emptyLabel={emptyLabel}
          aria-labelledby={labelId}
        />
      </div>
    </div>
  );
}
