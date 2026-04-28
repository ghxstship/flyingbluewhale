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
