/**
 * Pure helpers for the POS product-resolution path (kit 30 UPC half).
 *
 * A scanned retail code resolves through `catalog_item_gtins` — the org's
 * "this GTIN is this catalog item, to us" binding — NOT through
 * `assignment_scan_codes` (whose `assignment_id NOT NULL` + active-unique
 * index model entitlement tokens, not product classes; see
 * docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §2.1).
 *
 * This module is deliberately dependency-light and client-safe: the resolver
 * (`@/lib/db/scan`, server-only) uses these for the decision logic, and the
 * field surface uses them to recognise a bindable unknown GTIN. Keeping the
 * logic pure is also what makes the resolver's hit/miss/wrong-org behavior
 * unit-testable without a database.
 */

import { normalizeGtin } from "./gtin";

/**
 * Canonical GTIN-14 for a code that could be a retail product code, or null
 * when it cannot. This is the product resolver's admission gate: a gate QR,
 * an asset tag ("R7-014"), or a misread (bad check digit) never reaches the
 * binding lookup — and, on miss, never pollutes the product path's behavior.
 */
export function posGtinCandidate(code: string): string | null {
  const normalized = normalizeGtin(code);
  return normalized.ok ? normalized.gtin14 : null;
}

/**
 * Belt-and-braces match check for a binding row returned by the DB.
 *
 * The query is already scoped `.eq("org_id").eq("gtin14")`, so in practice a
 * mismatching row cannot come back — but the org boundary is the one invariant
 * a refactor must never silently lose (a UPC is the same digits in every
 * tenant; the BINDING is the org's opinion). Re-asserting it here makes the
 * scoping a tested property instead of an untested query detail.
 */
export function bindingMatches(
  binding: { org_id: string; gtin14: string },
  orgId: string,
  gtin14: string,
): boolean {
  return binding.org_id === orgId && binding.gtin14 === gtin14;
}

/** "Vehicle · Golf Cart" — singular kind label · catalog item name. */
export function productDisplayName(kindLabel: string, name: string): string {
  return `${kindLabel} · ${name}`;
}

/** Join the non-empty parts of an advance-line subtitle with the house `·`. */
export function productLineSubtitle(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join(" · ");
}
