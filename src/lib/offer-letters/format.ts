import { urlFor } from "@/lib/urls";
import { formatDateParts, formatMoney } from "@/lib/i18n/format";
import type { OfferLetterResolved, CompensationBasis } from "./types";

/**
 * The one per-org system role that manual (non-catalog) positions attach
 * to (see the console roster's letter-state.ts, which re-exports these).
 * The custom title itself lives on the letter (expectations_override), so
 * every position render must prefer it — rendering the role label for a
 * custom-position letter shows the infrastructure row's "Custom Position"
 * instead of the actual title (the jack-sparrow mobile leg caught exactly
 * that on /m/roster's contract screen).
 */
export const CUSTOM_POSITION_SLUG = "custom-position";
export const CUSTOM_POSITION_LABEL = "Custom Position";

/** Display title for a letter's position — the ONE rule, both shells. */
export function displayRoleTitle(
  roleSlug: string | null | undefined,
  roleTitle: string | null | undefined,
  expectationsOverride: string | null | undefined,
): string {
  if (roleSlug === CUSTOM_POSITION_SLUG && expectationsOverride && expectationsOverride.trim().length > 0) {
    return expectationsOverride.trim().split("\n")[0] ?? expectationsOverride.trim();
  }
  return roleTitle ?? "—";
}

export function offerPublicUrl(token: string): string {
  // Public offer-letter URL — unauthenticated, served by the apex (marketing
  // shell) so signers don't land on an auth-walled subdomain.
  return urlFor("marketing", `/offer/${token}`);
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "TBD";
  const fmt = (iso: string) =>
    // Parse as UTC midnight so the rendered day never shifts by timezone.
    formatDateParts(iso + "T00:00:00Z", { month: "short", day: "numeric", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end)!);
}

export function formatDollars(cents: number): string {
  return formatMoney(cents, { fractionDigits: 0 });
}

/** The (compensation-only) slice of a resolved letter that drives the comp
 *  summary line. Widened from `OfferLetterResolved` so callers that only carry
 *  these four fields (e.g. the kit document binding bridge) can reuse the
 *  Nevada-IC-compliant framing without assembling a full resolved letter. */
export type CompensationFields = Pick<
  OfferLetterResolved,
  "compensation_basis" | "effective_compensation_cents" | "rate_name" | "rate_unit_price_cents"
>;

/**
 * Compensation summary line — Nevada IC compliant framing.
 *
 * Per SCXEDC26-NV-IC-LETTERS-v1.md, day rates must be framed as
 * *per-service-day deliverable fees* referencing the daily deliverable
 * in §5, not as wages. No overtime, no minimum-call, no per-diem-labeled-
 * as-such; pre-approved travel/lodging is reimbursed against receipts.
 */
export function formatCompensation(letter: CompensationFields): string {
  if (letter.compensation_basis === "tbd" || letter.effective_compensation_cents === 0) {
    return letter.rate_name ? `TBD — rate card: ${letter.rate_name}` : "To be confirmed prior to signature";
  }
  const total = formatDollars(letter.effective_compensation_cents);
  switch (letter.compensation_basis) {
    case "per_day":
      return letter.rate_unit_price_cents
        ? `${formatDollars(letter.rate_unit_price_cents)} per documented service-day deliverable`
        : total;
    case "per_show_day":
      return letter.rate_unit_price_cents
        ? `${formatDollars(letter.rate_unit_price_cents)} per documented show-day deliverable`
        : total;
    case "hourly":
      return letter.rate_unit_price_cents
        ? `${formatDollars(letter.rate_unit_price_cents)} per hour (per-deliverable acceptance, not wage)`
        : total;
    case "flat_fee":
    default:
      return `${total} (flat project fee — milestone schedule per §5)`;
  }
}

/** Per-diem display — Nevada IC compliance forbids "per diem" labeled as
 *  such (it reads as wage replacement). Reframe as expense reimbursement
 *  against documented receipts up to the daily cap.
 */
export function formatPerDiem(cents: number | null | undefined): string {
  if (!cents || cents === 0) return "—";
  return `Pre-approved travel and lodging reimbursed against documented receipts, up to ${formatDollars(cents)} per service day`;
}

export function basisLabel(b: CompensationBasis): string {
  switch (b) {
    case "per_day":
      return "Per Day";
    case "per_show_day":
      return "Per Show Day";
    case "flat_fee":
      return "Flat Project Fee";
    case "hourly":
      return "Hourly";
    case "tbd":
      return "To Be Confirmed";
  }
}
