import type { BadgeVariant } from "@/components/ui/Badge";

/**
 * Kit 30 Project Roster — letter_state display maps.
 *
 * The shared `src/lib/offer-letters/types.ts` STATUS_LABEL predates the
 * offer_letter_status enum growing COUNTERSIGNED / ACTIVE / SUPERSEDED /
 * VOIDED, so the roster carries its own complete 11-value map rather than
 * editing the shared lib's 7-value one out from under the letter pages.
 * Pure module — safe for both server and client imports.
 */
export const LETTER_STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Offer Sent",
  viewed: "Offer Viewed",
  accepted: "Accepted",
  countersigned: "Countersigned",
  active: "Contracted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
  superseded: "Superseded",
  voided: "Voided",
};

export const LETTER_STATE_VARIANT: Record<string, BadgeVariant> = {
  draft: "muted",
  sent: "info",
  viewed: "info",
  accepted: "success",
  countersigned: "success",
  active: "success",
  declined: "error",
  withdrawn: "muted",
  expired: "muted",
  superseded: "muted",
  voided: "muted",
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
