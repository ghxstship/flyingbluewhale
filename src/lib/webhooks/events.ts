/**
 * SSOT for webhook / notification event types.
 *
 * This list used to exist twice: as the `NotifyEvent` union in
 * `src/lib/notify.ts` (what the app can EMIT) and as the `EVENTS` tuple in
 * `src/app/api/v1/webhooks/endpoints/route.ts` (what an endpoint may
 * SUBSCRIBE to). Nothing bound them, and they drifted: `ticket.scanned`
 * stayed subscribable after migration 0067 renamed the emitter to
 * `assignment.scanned`, so every endpoint subscribed to it received
 * silence forever, while `offer_letter.*` and `marketplace.inquiry_received`
 * could fire but could not be subscribed to except via `*`.
 *
 * One list now. Emittable and subscribable are the same set by
 * construction, and `webhook-events.test.ts` fails if a second list
 * reappears.
 *
 * Deliberately dependency-free (no "server-only") so both the emitter and
 * the route's Zod schema can import it.
 */
export const WEBHOOK_EVENTS = [
  "project.created",
  "project.status_changed",
  "invoice.sent",
  "invoice.paid",
  "proposal.sent",
  "proposal.signed",
  "deliverable.submitted",
  "deliverable.approved",
  "assignment.scanned",
  "po.acknowledged",
  "po.fulfilled",
  "incident.filed",
  "offer_letter.accepted",
  "offer_letter.declined",
  "job.failed",
  "passkey.registered",
  "account.deletion_requested",
  "marketplace.inquiry_received",

  // Time & pay (TIME_MANAGEMENT_LIFECYCLE_PLAN.md Phase 4). These are the
  // hooks an external payroll connector subscribes to instead of polling —
  // the rule being that anything the native connectors can do, an outside
  // integrator can do through the same public surface.
  "timesheet.submitted",
  "timesheet.approved",
  "timesheet.rejected",
  "timesheet.posted",
  "payroll.posted",
  "time.correction_requested",
  "time.correction_decided",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Subscription wildcard — every event, including ones added later. */
export const WEBHOOK_WILDCARD = "*" as const;

/**
 * What `POST /api/v1/webhooks/endpoints` accepts in `events[]`: every real
 * event plus the wildcard.
 */
export const SUBSCRIBABLE_EVENTS = [...WEBHOOK_EVENTS, WEBHOOK_WILDCARD] as const;

export type SubscribableEvent = (typeof SUBSCRIBABLE_EVENTS)[number];

/**
 * Retired event names still accepted on subscribe and normalized to their
 * live equivalent, so an integrator's stored config (and any endpoint row
 * written before the rename) keeps working instead of silently failing a
 * Zod enum. Nothing emits these.
 */
export const DEPRECATED_EVENT_ALIASES: Readonly<Record<string, WebhookEvent>> = {
  // Renamed advancing → assignment in migration 0067; the subscription
  // list was never updated, which is what made ticket.scanned dead.
  "ticket.scanned": "assignment.scanned",
};

/** Accepted on input: live events + wildcard + deprecated aliases. */
export const ACCEPTED_EVENT_INPUTS = [
  ...SUBSCRIBABLE_EVENTS,
  ...Object.keys(DEPRECATED_EVENT_ALIASES),
] as const;

/** Map any accepted input onto the name the emitter actually fires. */
export function normalizeWebhookEvent(event: string): string {
  return DEPRECATED_EVENT_ALIASES[event] ?? event;
}
