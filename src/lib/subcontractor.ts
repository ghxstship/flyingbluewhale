/**
 * Subcontractor-Operations canon (v7.5).
 *
 * Enum tuples + label maps + the eligibility-verdict derivation, mirroring the
 * `src/lib/marketplace.ts` shape. The DB is the SSOT: `work_order_state` /
 * `change_order_state` / `dispatch_mode` / `visibility` are CHECK-constrained in
 * migration `20260629120000_subcontractor_ops_p1.sql`, and the eligibility
 * verdict is the `v_sub_eligibility` view. These tuples must stay in lockstep
 * with those constraints (guarded by `subcontractor.test.ts`).
 *
 * The doc-status + verdict derivation is duplicated here (pure, no I/O) so the
 * client can recompute/explain a verdict without a round-trip — same rules as
 * the view (30-day alert window).
 */

// ── Compliance ──────────────────────────────────────────────────────────
export const COMPLIANCE_DOC_KINDS = ["coi", "w9", "license", "cert"] as const;
export type ComplianceDocKind = (typeof COMPLIANCE_DOC_KINDS)[number] | (string & {});

export const DOC_STATUSES = ["current", "expiring", "expired", "missing"] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const ELIGIBILITY_VERDICTS = ["eligible", "expiring", "blocked"] as const;
export type EligibilityVerdict = (typeof ELIGIBILITY_VERDICTS)[number];

/** Days before expiry a document flips to `expiring`. Matches the SQL view. */
export const EXPIRY_ALERT_DAYS = 30;

export const DOC_KIND_LABELS: Record<string, string> = {
  coi: "Certificate of Insurance",
  w9: "W-9",
  license: "Trade License",
  cert: "Certification",
};

export const VERDICT_LABELS: Record<EligibilityVerdict, string> = {
  eligible: "Eligible",
  expiring: "Expiring soon",
  blocked: "Blocked",
};

/** Badge variant per verdict (kit semantic vocabulary). */
export const VERDICT_BADGE: Record<EligibilityVerdict, "success" | "warning" | "error"> = {
  eligible: "success",
  expiring: "warning",
  blocked: "error",
};

export const DOC_STATUS_BADGE: Record<DocStatus, "success" | "warning" | "error" | "muted"> = {
  current: "success",
  expiring: "warning",
  expired: "error",
  missing: "muted",
};

/**
 * Derive a single document's status from its expiry. Pure mirror of
 * `v_compliance_doc_status` — `null` expiry = non-expiring (always current).
 * `now` is injectable for deterministic tests (never read the clock in render).
 */
export function deriveDocStatus(expiresOn: string | null | undefined, now: Date): Exclude<DocStatus, "missing"> {
  if (!expiresOn) return "current";
  const exp = new Date(expiresOn + "T00:00:00Z").getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.floor((exp - today) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= EXPIRY_ALERT_DAYS) return "expiring";
  return "current";
}

/** Remaining-life percentage for the meter (0–100). Mirrors the view. */
export function remainingPct(expiresOn: string | null | undefined, now: Date): number {
  if (!expiresOn) return 100;
  const exp = new Date(expiresOn + "T00:00:00Z").getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.floor((exp - today) / 86_400_000);
  if (days < 0) return 0;
  return Math.max(0, Math.min(100, Math.round((days / EXPIRY_ALERT_DAYS) * 100)));
}

export type RequirementCheck = { kind: ComplianceDocKind; status: DocStatus };

/**
 * Derive the eligibility verdict from per-requirement statuses — the gate
 * Dispatch reads. `blocked` if any required doc is missing/expired; `expiring`
 * if any is within the alert window; else `eligible`. Mirrors `v_sub_eligibility`.
 */
export function deriveVerdict(checks: RequirementCheck[]): EligibilityVerdict {
  if (checks.some((c) => c.status === "missing" || c.status === "expired")) return "blocked";
  if (checks.some((c) => c.status === "expiring")) return "expiring";
  return "eligible";
}

// ── Work orders ─────────────────────────────────────────────────────────
export const WORK_ORDER_STATES = [
  "draft",
  "posted",
  "bids-in",
  "awarded",
  "in-progress",
  "complete",
  "approved",
  "invoiced",
  "closed",
  "cancelled",
] as const;
export type WorkOrderState = (typeof WORK_ORDER_STATES)[number];

export const WORK_ORDER_STATE_LABELS: Record<WorkOrderState, string> = {
  draft: "Draft",
  posted: "Posted",
  "bids-in": "Bids in",
  awarded: "Awarded",
  "in-progress": "In progress",
  complete: "Complete",
  approved: "Approved",
  invoiced: "Invoiced",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const DISPATCH_MODES = ["allow-offers", "firm-price", "instant-book", "assign"] as const;
export type DispatchMode = (typeof DISPATCH_MODES)[number];

export const DISPATCH_MODE_LABELS: Record<DispatchMode, string> = {
  "allow-offers": "Allow offers",
  "firm-price": "Firm price",
  "instant-book": "Instant book",
  assign: "Direct assign",
};

export const WORK_ORDER_VISIBILITIES = ["private", "public"] as const;
export type WorkOrderVisibility = (typeof WORK_ORDER_VISIBILITIES)[number];

/**
 * Allowed forward transitions, enforced server-side so a stale tab can't write
 * an illegal jump (same pattern as advancing's NEXT_FULFILLMENT_STATES).
 */
export const NEXT_WORK_ORDER_STATES: Record<WorkOrderState, WorkOrderState[]> = {
  draft: ["posted", "cancelled"],
  posted: ["bids-in", "awarded", "cancelled"],
  "bids-in": ["awarded", "cancelled"],
  awarded: ["in-progress", "cancelled"],
  "in-progress": ["complete", "cancelled"],
  complete: ["approved"],
  approved: ["invoiced"],
  invoiced: ["closed"],
  closed: [],
  cancelled: [],
};

export function canTransitionWorkOrder(from: WorkOrderState, to: WorkOrderState): boolean {
  return NEXT_WORK_ORDER_STATES[from]?.includes(to) ?? false;
}

export const CHANGE_ORDER_STATES = ["pending", "approved", "declined"] as const;
export type ChangeOrderState = (typeof CHANGE_ORDER_STATES)[number];

// ── Sub invoicing (P3 → merged into invoices, Phase A §09) ────────────────
// As of migration 20260703170100 the sub_invoices table is GONE — inbound
// subcontractor payment applications are `invoices` rows with
// `source = 'ap_sub'` (+ retainage_pct, lien_waiver_id, work_order_id,
// purchase_order_id). /studio/finance/sub-invoices is a filtered lens on
// that one store. The AP lifecycle arc below rides the shared
// `invoice_state` enum; the DB gates it (approved-WO on insert, lien
// waiver before paid).
export const INVOICE_SOURCES = ["ar", "ap_sub"] as const;
export type InvoiceSource = (typeof INVOICE_SOURCES)[number];

export const INVOICE_SOURCE_LABELS: Record<InvoiceSource, string> = {
  ar: "AR",
  ap_sub: "AP · Sub",
};

export const SUB_INVOICE_STATES = ["submitted", "approved", "paid", "rejected"] as const;
export type SubInvoiceState = (typeof SUB_INVOICE_STATES)[number];

export const SUB_INVOICE_STATE_LABELS: Record<SubInvoiceState, string> = {
  submitted: "Submitted",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

export const SUB_INVOICE_BADGE: Record<SubInvoiceState, "info" | "success" | "muted" | "error"> = {
  submitted: "info",
  approved: "success",
  paid: "muted",
  rejected: "error",
};

/** Allowed forward transitions for an inbound sub-invoice (server-enforced). */
export const NEXT_SUB_INVOICE_STATES: Record<SubInvoiceState, SubInvoiceState[]> = {
  submitted: ["approved", "rejected"],
  approved: ["paid"],
  paid: [],
  rejected: [],
};

// ── Waiver gate (kit contract: waiver on file before Paid) ────────────────
/** lien_waivers.waiver_state values that count as "on file" for pay release. */
export const WAIVER_ON_FILE_STATES = ["signed", "returned", "released"] as const;

export function waiverOnFile(state: string | null | undefined): boolean {
  return !!state && (WAIVER_ON_FILE_STATES as readonly string[]).includes(state);
}

/** Badge copy for the sub-invoice waiver column. Missing blocks pay. */
export function waiverBadge(state: string | null | undefined): {
  label: string;
  variant: "success" | "info" | "error";
} {
  if (waiverOnFile(state)) return { label: "On File", variant: "success" };
  if (state === "sent" || state === "drafted") return { label: "Sent", variant: "info" };
  return { label: "Missing · Blocks Pay", variant: "error" };
}

// ── Vendor scorecard (P3) ──────────────────────────────────────────────────
/** Weighted composite 0–100 from on-time %, quality (0–5→%), disputes penalty. */
export function compositeScore(onTimePct: number, qualityAvg: number, disputes: number): number {
  const quality = (qualityAvg / 5) * 100;
  const base = onTimePct * 0.5 + quality * 0.5;
  const penalty = Math.min(20, disputes * 4);
  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

/** Format integer cents as USD (mirrors the finance display convention). */
export function formatCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
