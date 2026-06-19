export const CHANNELS = ["email", "in_app", "slack", "push"] as const;
export const EVENTS = [
  "invoice.sent",
  "invoice.paid",
  "proposal.signed",
  "deliverable.submitted",
  "task.assigned",
  "ticket.scanned",
  "advance.approved",
] as const;

/** Human-readable labels — the raw dotted key is an internal identifier and
 * must never surface in the UI. */
export const EVENT_LABELS: Record<(typeof EVENTS)[number], string> = {
  "invoice.sent": "Invoice sent",
  "invoice.paid": "Invoice paid",
  "proposal.signed": "Proposal signed",
  "deliverable.submitted": "Deliverable submitted",
  "task.assigned": "Task assigned",
  "ticket.scanned": "Ticket scanned",
  "advance.approved": "Advance approved",
};
