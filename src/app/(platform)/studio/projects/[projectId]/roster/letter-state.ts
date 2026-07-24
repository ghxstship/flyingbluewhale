import type { BadgeVariant } from "@/components/ui/Badge";
import { STATUS_LABEL, STATUS_VARIANT } from "@/lib/offer-letters/types";

/**
 * Kit 30 Project Roster — letter_state display maps.
 *
 * Formerly a parallel 11-value vocabulary carried here because the shared
 * `src/lib/offer-letters/types.ts` maps predated the offer_letter_status
 * enum growing COUNTERSIGNED / ACTIVE / SUPERSEDED / VOIDED. The shared lib
 * now covers the full enum (unified 2026-07-24), so these are re-exports —
 * one vocabulary, two names for call-site continuity. The roster's richer
 * wording for sent/viewed ("Offer Sent"/"Offer Viewed") stays as a local
 * overlay: on a roster board the noun matters, on a letter page it's
 * redundant.
 */
export const LETTER_STATE_LABEL: Record<string, string> = {
  ...STATUS_LABEL,
  sent: "Offer Sent",
  viewed: "Offer Viewed",
};

export const LETTER_STATE_VARIANT: Record<string, BadgeVariant> = {
  ...STATUS_VARIANT,
  // The roster board reads "viewed" as progress, not a warning.
  viewed: "info",
};

/** Letters that still represent a live engagement on the project. */
export const LIVE_LETTER_STATES = ["draft", "sent", "viewed", "accepted", "countersigned", "active"] as const;

/**
 * The one per-org system role that manual (non-catalog) positions attach
 * to. `offer_letters.role_id` is NOT NULL, so a custom position needs a
 * role row; this fixed slug keeps custom titles OUT of the org's position
 * catalog (one infrastructure row per org, never one per custom title).
 * The custom title itself is stored on the letter (expectations_override)
 * until the kit 30 schema wave lands a dedicated column.
 */
export { CUSTOM_POSITION_SLUG, CUSTOM_POSITION_LABEL, displayRoleTitle } from "@/lib/offer-letters/format";
