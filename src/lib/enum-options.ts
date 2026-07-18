import { Constants } from "@/lib/supabase/database.types";

/**
 * Enum / lookup option SSOT for UI controls.
 *
 * Two sources of truth, one option shape:
 *   - `enumOptions(name)` — native Postgres enums, read from the generated
 *     `Constants` object (never hand-retyped in a component). Options come back
 *     in enum-declared order.
 *   - `fetchLookupOptions(table)` — the `ref_*` lookup tables, ordered by
 *     `sort_order`, active-only for new-record forms (inactive kept for filters
 *     and for a value a record already holds).
 *
 * This replaces inline `<option>` lists / local `as const` arrays that silently
 * fork from the schema. See docs/schema/enum-ui-enrichment-2026-07-18.md.
 */

export type Option = { value: string; label: string };

type EnumName = keyof typeof Constants.public.Enums;

/** Title-case a snake_case code as a display fallback. Values that already
 *  carry caps, digits, or spaces (e.g. "04 Physical", "OPEN") pass through. */
export function humanizeToken(code: string): string {
  if (/[A-Z0-9]/.test(code) || code.includes(" ")) return code;
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Native-enum options in enum-declared order. Pass `labels` to override the
 *  humanized fallback for specific codes (prefer an existing `*_LABEL` map from
 *  the relevant src/lib module when one exists). */
export function enumOptions(name: EnumName, labels?: Record<string, string>): Option[] {
  return Constants.public.Enums[name].map((value) => ({
    value,
    label: labels?.[value] ?? humanizeToken(value),
  }));
}

/** Turn any `{value,label}[]` into a `code → label` map for list rendering. */
export function optionLabelMap(options: Option[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}
