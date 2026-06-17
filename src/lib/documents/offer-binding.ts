/**
 * Offer-letter record-binding bridge — maps a resolved `offer_letters` record
 * (the rich engagement letter authored in the offer-letters system, rendered
 * on its own page by `LetterDocument`) into the kit `offerletter` document
 * template's merge-field data object (keyed by the template's `data-path`s, see
 * contract.ts + registry.ts).
 *
 * This is the seam that reconciles the two offer-letter renderings: the
 * offer-letters system (src/lib/offer-letters + LetterDocument) owns authoring,
 * the signer flow, and the e-signature audit trail; the kit documents engine
 * owns the OpenAPI-described, print-clean `.doc` artifact. One stored record
 * now drives BOTH classification/comp/dates surfaces, so the kit doc can never
 * fall back to sample copy on a real letter.
 *
 * Pure + dependency-light (types + the IC-compliant comp/per-diem/date
 * formatters only) so it unit-tests without a DB or `server-only` — the
 * resolver in resolvers.ts wraps it with the org-scoped fetch.
 */
import type { OfferLetterResolved } from "@/lib/offer-letters/types";
import { EMPLOYER_LABEL, CLASSIFICATION_LABEL, BASIS_LABEL } from "@/lib/offer-letters/types";
import { formatCompensation, formatPerDiem } from "@/lib/offer-letters/format";
import { formatDate } from "@/lib/i18n/format";

type DocData = Record<string, unknown>;

/**
 * The slice of a resolved letter the bridge reads. A structural subset of
 * `OfferLetterResolved` so the mapper (and its test) needn't assemble a full
 * resolved row — only the classification / compensation / engagement-window /
 * inclusion / signer fields the kit template renders.
 */
export type OfferBindingInput = Pick<
  OfferLetterResolved,
  | "id"
  | "role_department"
  | "reports_to_name"
  | "reports_to_role"
  | "venue_name"
  | "venue_city"
  | "venue_region"
  | "travel_in_date"
  | "onsite_start_date"
  | "onsite_end_date"
  | "travel_out_date"
  | "effective_onsite_start"
  | "effective_onsite_end"
  | "engagement_days"
  | "effective_compensation_cents"
  | "rate_name"
  | "rate_unit_price_cents"
  | "effective_per_diem_cents"
  | "effective_inclusions"
  | "effective_travel_provided"
  | "effective_lodging_provided"
  | "effective_meals_provided"
  | "signing_authority_name"
  | "signing_authority_title"
> & {
  // These are non-null on `OfferLetterResolved` but the underlying
  // `offer_letters_resolved` view returns them all-nullable — type them as the
  // view actually behaves so the bridge's guards aren't dead code and callers
  // needn't lie with a cast.
  recipient_name: OfferLetterResolved["recipient_name"] | null;
  project_name: OfferLetterResolved["project_name"] | null;
  role_title: OfferLetterResolved["role_title"] | null;
  classification: OfferLetterResolved["classification"] | null;
  employer: OfferLetterResolved["employer"] | null;
  compensation_basis: OfferLetterResolved["compensation_basis"] | null;
  effective_payment_schedule: OfferLetterResolved["effective_payment_schedule"] | null;
};

const longDate = (s: string | null | undefined): string | undefined => (s ? formatDate(s, "long") : undefined);

/**
 * Map a resolved offer letter → the kit `offerletter` template's data object.
 * Only fields the record actually carries are emitted; everything else is
 * omitted so the engine's resolve() falls back to the template sample (honest
 * coverage — a sparsely-filled letter still renders complete + correct).
 */
export function offerLetterData(letter: OfferBindingInput): DocData {
  // ── identity + role / assignment summary ──────────────────────────────────
  const offer: Record<string, unknown> = { id: `OL-${letter.id.slice(0, 8).toUpperCase()}` };
  if (letter.role_title) offer.role = letter.role_title;
  if (letter.role_department) offer.department = letter.role_department;
  if (letter.classification) offer.classification = CLASSIFICATION_LABEL[letter.classification];
  if (letter.employer) offer.employer = EMPLOYER_LABEL[letter.employer];
  if (letter.project_name) offer.project = letter.project_name;
  const reportsTo = letter.reports_to_name
    ? `${letter.reports_to_name}${letter.reports_to_role ? ` · ${letter.reports_to_role}` : ""}`
    : undefined;
  if (reportsTo) offer.reportsTo = reportsTo;
  const workLocation = [letter.venue_name, letter.venue_city, letter.venue_region].filter(Boolean).join(" · ");
  if (workLocation) offer.workLocation = workLocation;
  if (letter.engagement_days > 0) offer.days = String(letter.engagement_days);

  // ── engagement window (override → canonical, mirrors LetterDocument) ───────
  const dates: Record<string, unknown> = {};
  const travelIn = longDate(letter.travel_in_date);
  const onsiteStart = longDate(letter.effective_onsite_start ?? letter.onsite_start_date);
  const onsiteEnd = longDate(letter.effective_onsite_end ?? letter.onsite_end_date);
  const travelOut = longDate(letter.travel_out_date);
  if (travelIn) dates.travelIn = travelIn;
  if (onsiteStart) dates.onsiteStart = onsiteStart;
  if (onsiteEnd) dates.onsiteEnd = onsiteEnd;
  if (travelOut) dates.travelOut = travelOut;

  // ── compensation (IC-compliant framing, reused from the rich renderer) ─────
  const comp: Record<string, unknown> = {};
  if (letter.compensation_basis) {
    comp.basis = BASIS_LABEL[letter.compensation_basis];
    comp.amount = formatCompensation({
      compensation_basis: letter.compensation_basis,
      effective_compensation_cents: letter.effective_compensation_cents,
      rate_name: letter.rate_name,
      rate_unit_price_cents: letter.rate_unit_price_cents,
    });
  }
  if (letter.effective_per_diem_cents) comp.reimbursement = formatPerDiem(letter.effective_per_diem_cents);
  if (letter.effective_payment_schedule) comp.paymentSchedule = letter.effective_payment_schedule;

  // ── inclusions (explicit list + the three provided flags) ──────────────────
  const inclusions = [...(letter.effective_inclusions ?? [])];
  if (letter.effective_travel_provided) inclusions.push("Travel provided / arranged");
  if (letter.effective_lodging_provided) inclusions.push("Lodging provided");
  if (letter.effective_meals_provided) inclusions.push("Crew meals on call days");

  // ── signing authority ──────────────────────────────────────────────────────
  const signer: Record<string, unknown> = {};
  if (letter.signing_authority_name) signer.name = letter.signing_authority_name;
  if (letter.signing_authority_title) signer.title = letter.signing_authority_title;

  const data: DocData = { offer };
  if (letter.recipient_name) data.candidate = { name: letter.recipient_name };
  if (Object.keys(dates).length) data.dates = dates;
  if (Object.keys(comp).length) data.comp = comp;
  if (inclusions.length) data.inclusions = inclusions;
  if (Object.keys(signer).length) data.signer = signer;
  return data;
}
