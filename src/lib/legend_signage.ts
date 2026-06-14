/**
 * LEG3ND — Signage Library.
 *
 * Shared enum tuples + derived types + label maps + small helpers for the
 * signage library (org-scoped catalog of ISO 7010 / DOT-AIGA / ISA signs)
 * and its per-project placement ledger. Pattern matches
 * `src/lib/connecteam.ts` / `src/lib/marketplace.ts`: tuples `as const` →
 * derived union types → label maps + a couple of pure helpers.
 *
 * Lifecycle columns follow LDP: `sign_state` + `placement_state` are
 * cyclical operational states backed by named postgres enums (see
 * `supabase/migrations/PENDING_legend_signage_library.sql`).
 */

// ============================================================
// Standards (the pictogram source standard)
// ============================================================
export const SIGNAGE_STANDARDS = ["iso7010", "dot_aiga", "isa", "custom"] as const;
export type SignageStandard = (typeof SIGNAGE_STANDARDS)[number];
export const SIGNAGE_STANDARD_LABELS: Record<SignageStandard, string> = {
  iso7010: "ISO 7010",
  dot_aiga: "DOT / AIGA",
  isa: "ISA",
  custom: "Custom",
};

// ============================================================
// Categories (life-safety / wayfinding taxonomy)
// ============================================================
export const SIGNAGE_CATEGORIES = [
  "prohibition",
  "warning",
  "mandatory",
  "safe_condition",
  "fire",
  "wayfinding",
  "accessibility",
] as const;
export type SignageCategory = (typeof SIGNAGE_CATEGORIES)[number];
export const SIGNAGE_CATEGORY_LABELS: Record<SignageCategory, string> = {
  prohibition: "Prohibition",
  warning: "Warning",
  mandatory: "Mandatory",
  safe_condition: "Safe Condition",
  fire: "Fire Safety",
  wayfinding: "Wayfinding",
  accessibility: "Accessibility",
};

// ============================================================
// Sign lifecycle — sign_state (cyclical)
// ============================================================
export const SIGN_STATES = ["draft", "published", "archived"] as const;
export type SignState = (typeof SIGN_STATES)[number];
export const SIGN_STATE_LABELS: Record<SignState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

// ============================================================
// Placement lifecycle — placement_state (cyclical)
// ============================================================
export const PLACEMENT_STATES = ["planned", "installed", "removed"] as const;
export type PlacementState = (typeof PLACEMENT_STATES)[number];
export const PLACEMENT_STATE_LABELS: Record<PlacementState, string> = {
  planned: "Planned",
  installed: "Installed",
  removed: "Removed",
};

// ============================================================
// Row shapes — hand-written until types regen (LooseSupabase access).
// ============================================================
export type SignageSign = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  standard: SignageStandard;
  category: SignageCategory;
  pictogram_key: string;
  colorway: string | null;
  sign_state: SignState;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SignagePlacement = {
  id: string;
  org_id: string;
  sign_id: string;
  project_id: string | null;
  location: string;
  quantity: number;
  placement_state: PlacementState;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

// ============================================================
// Helpers
// ============================================================

/** Type-guard: is the value a recognized signage category? */
export function isSignageCategory(v: string): v is SignageCategory {
  return (SIGNAGE_CATEGORIES as readonly string[]).includes(v);
}

/**
 * Per-category fallback symbol id in `public/brand/pictograms.svg` —
 * used when a sign has no explicit pictogram_key. Keys map to real
 * `p-*` symbols present in the shared sprite.
 */
export const CATEGORY_FALLBACK_SYMBOL: Record<SignageCategory, string> = {
  prohibition: "p-noentry",
  warning: "p-warning",
  mandatory: "p-info",
  safe_condition: "p-exit",
  fire: "p-fire",
  wayfinding: "p-arrow",
  accessibility: "p-access",
};

/**
 * Resolve the shared symbol id for a sign's pictogram, with a safe fallback
 * to the per-category generic glyph when a sign has no specific key. Use
 * the returned id in <use href={`/brand/pictograms.svg#${id}`} />.
 */
export function pictogramSymbolId(sign: Pick<SignageSign, "pictogram_key" | "category">): string {
  const key = sign.pictogram_key?.trim();
  return key && key.length > 0 ? key : CATEGORY_FALLBACK_SYMBOL[sign.category];
}

/**
 * Roll up a placement list into per-state counts (weighted by quantity).
 * Drives the placement summary on the sign detail page.
 */
export function placementTotals(rows: SignagePlacement[]): Record<PlacementState, number> {
  const totals: Record<PlacementState, number> = { planned: 0, installed: 0, removed: 0 };
  for (const r of rows) {
    totals[r.placement_state] += r.quantity ?? 0;
  }
  return totals;
}
