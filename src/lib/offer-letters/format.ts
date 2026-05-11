import { urlFor } from "@/lib/urls";
import type { OfferLetterResolved, CompensationBasis } from "./types";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/lib/i18n/config";

export function offerPublicUrl(token: string): string {
  // Public offer-letter URL — unauthenticated, served by the apex (marketing
  // shell) so signers don't land on an auth-walled subdomain.
  return urlFor("marketing", `/offer/${token}`);
}

export function formatDateRange(start: string | null, end: string | null, locale = DEFAULT_LOCALE): string {
  if (!start && !end) return "TBD";
  const fmt = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end)!);
}

export function formatDollars(cents: number, locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY): string {
  return (cents / 100).toLocaleString(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

/**
 * Compensation summary line. Reads from the resolved view's
 * `effective_compensation_cents` (which already accounts for override or
 * rate × engagement_days).
 */
export function formatCompensation(letter: OfferLetterResolved, locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY): string {
  if (letter.compensation_basis === "tbd" || letter.effective_compensation_cents === 0) {
    return letter.rate_name ? `TBD — rate card: ${letter.rate_name}` : "To be confirmed prior to signature";
  }
  const total = formatDollars(letter.effective_compensation_cents, locale, currency);
  switch (letter.compensation_basis) {
    case "per_day":
    case "per_show_day":
      return letter.rate_unit_price_cents
        ? `${formatDollars(letter.rate_unit_price_cents, locale, currency)} per day × ${letter.engagement_days} days = ${total}`
        : total;
    case "hourly":
      return letter.rate_unit_price_cents
        ? `${formatDollars(letter.rate_unit_price_cents, locale, currency)} per hour (${total} estimated)`
        : total;
    case "flat_fee":
    default:
      return total;
  }
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
