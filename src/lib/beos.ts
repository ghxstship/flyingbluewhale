/**
 * BEOs (Banquet Event Orders) — ATLVS Sales & CRM.
 *
 * Single helper file for the BEO document model added by migration
 * `PENDING_beos.sql`. Exports the lifecycle + line-section enum tuples
 * (`as const` → derived types), their label maps, the legal-transition
 * table for the `beo_state` FSM, and a couple of small totalling helpers
 * shared by the ATLVS console pages. Pattern matches `src/lib/marketplace.ts`
 * and `src/lib/workforce.ts`.
 */

// ============================================================
// BEO lifecycle — cyclical operational state (`beo_state`)
// ============================================================
export const BEO_STATES = ["draft", "sent", "signed", "revised", "void"] as const;
export type BeoState = (typeof BEO_STATES)[number];

export const BEO_STATE_LABELS: Record<BeoState, string> = {
  draft: "Draft",
  sent: "Sent",
  signed: "Signed",
  revised: "Revised",
  void: "Void",
};

/**
 * Legal transitions for the BEO FSM. A BEO is a living document: once
 * sent it can be signed, re-opened for revision, or voided; a signed BEO
 * can still be revised (a change order) which loops back to `revised`,
 * from which it is re-sent. `void` is terminal.
 */
export const NEXT_BEO_STATES: Record<BeoState, readonly BeoState[]> = {
  draft: ["sent", "void"],
  sent: ["signed", "revised", "void"],
  signed: ["revised", "void"],
  revised: ["sent", "void"],
  void: [],
};

/** Whether `to` is a legal next state from `from`. */
export function canTransitionBeo(from: BeoState, to: BeoState): boolean {
  return NEXT_BEO_STATES[from]?.includes(to) ?? false;
}

// ============================================================
// Line sections (which banquet section a line belongs to)
// ============================================================
export const BEO_LINE_SECTIONS = [
  "food_beverage",
  "av",
  "staffing",
  "rentals",
  "labor",
  "other",
] as const;
export type BeoLineSection = (typeof BEO_LINE_SECTIONS)[number];

export const BEO_LINE_SECTION_LABELS: Record<BeoLineSection, string> = {
  food_beverage: "Food & Beverage",
  av: "Audio / Visual",
  staffing: "Staffing",
  rentals: "Rentals",
  labor: "Labor",
  other: "Other",
};

// ============================================================
// Shared shapes — light row types the pages share. The generated
// database.types.ts is the source of truth once the migration applies;
// these mirror the columns the UI reads so the pages stay typed without
// editing the generated file.
// ============================================================
export type BeoLineItem = {
  id: string;
  org_id: string;
  beo_id: string;
  section: BeoLineSection;
  name: string;
  description: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  sort_order: number;
};

// ============================================================
// Totalling helpers
// ============================================================

/** Extended total (in cents) for a single line: round(qty * unit). */
export function lineTotalCents(line: { quantity: number; unit_price_cents: number }): number {
  return Math.round(line.quantity * line.unit_price_cents);
}

/** Grand total (in cents) across a set of lines. */
export function beoTotalCents(lines: ReadonlyArray<{ quantity: number; unit_price_cents: number }>): number {
  return lines.reduce((sum, l) => sum + lineTotalCents(l), 0);
}

/**
 * Roll lines up by section → { section, lines, subtotal_cents }. Sections
 * are returned in canonical `BEO_LINE_SECTIONS` order, and only sections
 * that actually carry lines are included.
 */
export function groupBySection<T extends { section: BeoLineSection; quantity: number; unit_price_cents: number }>(
  lines: ReadonlyArray<T>,
): Array<{ section: BeoLineSection; label: string; lines: T[]; subtotal_cents: number }> {
  const out: Array<{ section: BeoLineSection; label: string; lines: T[]; subtotal_cents: number }> = [];
  for (const section of BEO_LINE_SECTIONS) {
    const group = lines.filter((l) => l.section === section);
    if (group.length === 0) continue;
    out.push({
      section,
      label: BEO_LINE_SECTION_LABELS[section],
      lines: group,
      subtotal_cents: beoTotalCents(group),
    });
  }
  return out;
}
