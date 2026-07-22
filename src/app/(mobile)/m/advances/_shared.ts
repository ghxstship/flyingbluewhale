/**
 * COMPVSS · Advances — shared presentation maps.
 *
 * These were duplicated verbatim between the list (`AdvancesView.tsx`) and the
 * detail page (`[assignmentId]/page.tsx` / `AdvanceDetail.tsx`); one home keeps
 * the icon/tone/label vocabulary from drifting. Data-level SSOTs (kinds,
 * lifecycle) stay in `@/lib/db/assignments` / `@/lib/db/catalog-kinds` — this
 * file is display-side only.
 */

/** Kit icon per catalog kind. */
export const KIND_ICON: Record<string, string> = {
  ticket: "Ticket",
  credential: "BadgeCheck",
  catering: "Utensils",
  radio: "RadioTower",
  tool: "Wrench",
  equipment: "Package",
  uniform: "Shirt",
  travel: "Plane",
  lodging: "BedDouble",
  vehicle: "Car",
  labor: "Users",
};

/** Badge tone per fulfillment state. */
export const STATE_TONE: Record<string, string> = {
  briefed: "neutral",
  draft: "neutral",
  submitted: "info",
  in_review: "info",
  revision_requested: "warn",
  approved: "ok",
  rejected: "danger",
  delivered: "ok",
  issued: "ok",
  transferred: "info",
  redeemed: "ok",
  expired: "neutral",
  voided: "danger",
  returned: "neutral",
};

/** Fallback prettifier for a state with no translation ("in_review" → "In Review"). */
export function prettyState(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type TFn = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

/** Translated label per fulfillment state (static keys, inline fallbacks). */
export function fulfillmentStateLabels(t: TFn): Record<string, string> {
  return {
    briefed: t("m.advances.state.briefed", undefined, "Briefed"),
    draft: t("m.advances.state.draft", undefined, "Draft"),
    submitted: t("m.advances.state.submitted", undefined, "Submitted"),
    in_review: t("m.advances.state.inReview", undefined, "In Review"),
    revision_requested: t("m.advances.state.revisionRequested", undefined, "Revision Requested"),
    approved: t("m.advances.state.approved", undefined, "Approved"),
    rejected: t("m.advances.state.rejected", undefined, "Rejected"),
    delivered: t("m.advances.state.delivered", undefined, "Delivered"),
    issued: t("m.advances.state.issued", undefined, "Issued"),
    transferred: t("m.advances.state.transferred", undefined, "Transferred"),
    redeemed: t("m.advances.state.redeemed", undefined, "Redeemed"),
    expired: t("m.advances.state.expired", undefined, "Expired"),
    voided: t("m.advances.state.voided", undefined, "Voided"),
    returned: t("m.advances.state.returned", undefined, "Returned"),
  };
}
