import "server-only";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

// ──────────────────────────────────────────────────────────────
// Catalog kinds — the things you can assign to a party.
// Mirrors public.catalog_kind in the database (0067; 'labor' added
// with the XPMS master catalog, migration 20260608120000).
// ──────────────────────────────────────────────────────────────

export const CATALOG_KINDS = [
  "ticket",
  "credential",
  "catering",
  "radio",
  "tool",
  "equipment",
  "uniform",
  "travel",
  "lodging",
  "vehicle",
  "labor",
] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const CATALOG_KIND_LABEL: Record<CatalogKind, string> = {
  ticket: "Tickets",
  credential: "Credentials",
  catering: "Catering",
  radio: "Radios",
  tool: "Tools",
  equipment: "Equipment",
  uniform: "Uniforms",
  travel: "Travel",
  lodging: "Lodging",
  vehicle: "Vehicles",
  labor: "Labor",
};

export const CATALOG_KIND_LABEL_SINGULAR: Record<CatalogKind, string> = {
  ticket: "Ticket",
  credential: "Credential",
  catering: "Catering item",
  radio: "Radio",
  tool: "Tool",
  equipment: "Equipment",
  uniform: "Uniform",
  travel: "Travel itinerary",
  lodging: "Lodging",
  vehicle: "Vehicle",
  labor: "Labor booking",
};

// ──────────────────────────────────────────────────────────────
// Fulfillment lifecycle — shared by deliverables and assignments.
// ──────────────────────────────────────────────────────────────

export const FULFILLMENT_STATES = [
  "briefed",
  "draft",
  "submitted",
  "in_review",
  "revision_requested",
  "approved",
  "rejected",
  "delivered",
  "issued",
  "transferred",
  "redeemed",
  "expired",
  "voided",
  "returned",
] as const;
export type FulfillmentState = (typeof FULFILLMENT_STATES)[number];

// Sequential transitions allowed by the UI. Server enforces these so a
// stale tab can't write an illegal jump (e.g. briefed → delivered).
export const NEXT_FULFILLMENT_STATES: Record<FulfillmentState, FulfillmentState[]> = {
  briefed: ["draft", "submitted", "issued"],
  draft: ["submitted"],
  submitted: ["in_review", "approved", "revision_requested", "rejected"],
  in_review: ["approved", "revision_requested", "rejected"],
  revision_requested: ["submitted", "rejected"],
  approved: ["delivered", "issued"],
  delivered: ["returned"],
  rejected: [],
  issued: ["transferred", "redeemed", "voided", "expired"],
  transferred: ["redeemed", "voided", "expired"],
  redeemed: [],
  expired: [],
  voided: [],
  returned: [],
};

// ──────────────────────────────────────────────────────────────
// Party — exactly one of (user, crew_member, external_holder).
// ──────────────────────────────────────────────────────────────

export type AssignmentPartyKind = "user" | "crew_member" | "external_holder";

// ──────────────────────────────────────────────────────────────
// Row types — the columns we project in the read helpers below.
// Loose by design: regen `supabase/database.types.ts` for the full
// generated row when needed.
// ──────────────────────────────────────────────────────────────

export type AssignmentListRow = {
  id: string;
  project_id: string;
  catalog_item_id: string;
  catalog_kind: CatalogKind;
  party_kind: AssignmentPartyKind;
  party_user_id: string | null;
  party_crew_id: string | null;
  party_external_id: string | null;
  fulfillment_state: FulfillmentState;
  title: string | null;
  deadline: string | null;
  issued_at: string | null;
  fulfilled_at: string | null;
  version: number;
  updated_at: string;
};

export type AssignmentDetailRow = AssignmentListRow & {
  org_id: string;
  notes: string | null;
  data: Record<string, unknown> | null;
  atom_id: string | null;
  created_at: string;
  created_by: string | null;
};

// ──────────────────────────────────────────────────────────────
// Read helpers
// ──────────────────────────────────────────────────────────────

const LIST_SELECT =
  "id, project_id, catalog_item_id, catalog_kind, party_kind, party_user_id, party_crew_id, party_external_id, fulfillment_state, title, deadline, issued_at, fulfilled_at, version, updated_at";

const DETAIL_SELECT = LIST_SELECT + ", org_id, notes, data, atom_id, created_at, created_by";

export async function listProjectAssignments(
  orgId: string,
  projectId: string,
  opts?: { kinds?: CatalogKind[]; limit?: number },
): Promise<AssignmentListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("assignments")
    .select(LIST_SELECT)
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .is("deleted_at", null);
  if (opts?.kinds && opts.kinds.length > 0) q = q.in("catalog_kind", opts.kinds);
  const { data, error } = await q.order("deadline", { ascending: true, nullsFirst: false }).limit(opts?.limit ?? 500);
  if (error) throw error;
  return (data ?? []) as unknown as AssignmentListRow[];
}

/** Exact population count behind `listProjectAssignments` — that helper
 *  caps at 500 rows, so list surfaces pair it with this count for honest
 *  truncation indicators (SC-2). */
export async function countProjectAssignments(orgId: string, projectId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .is("deleted_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function listMyAssignments(
  orgId: string,
  userId: string,
  opts?: { kinds?: CatalogKind[]; projectId?: string; limit?: number },
): Promise<AssignmentListRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("assignments")
    .select(LIST_SELECT)
    .eq("org_id", orgId)
    .eq("party_user_id", userId)
    .is("deleted_at", null);
  if (opts?.projectId) q = q.eq("project_id", opts.projectId);
  if (opts?.kinds && opts.kinds.length > 0) q = q.in("catalog_kind", opts.kinds);
  const { data, error } = await q.order("deadline", { ascending: true, nullsFirst: false }).limit(opts?.limit ?? 200);
  if (error) throw error;
  return (data ?? []) as unknown as AssignmentListRow[];
}

export async function getAssignment(orgId: string, id: string): Promise<AssignmentDetailRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  // Surface query errors instead of silently rendering not-found — a
  // transient PostgREST failure looked identical to a missing row.
  if (error) throw error;
  return (data ?? null) as unknown as AssignmentDetailRow | null;
}

// ──────────────────────────────────────────────────────────────
// Scan — unified gate-scan flow.
// Replaces src/lib/db/tickets.ts scanTicket(). Same race-handling
// pattern: conditional UPDATE on assignment_scan_codes claims the
// scan, parent assignment flips to 'redeemed', event journal records
// every attempt (accepted/duplicate/voided/not_found).
// ──────────────────────────────────────────────────────────────

export type ScanResult =
  | { result: "accepted"; assignmentId: string; scanCodeId: string; catalogKind: CatalogKind; title: string | null }
  | { result: "duplicate"; assignmentId: string; redeemedAt: string | null }
  | { result: "voided"; assignmentId: string }
  | { result: "expired"; assignmentId: string }
  | { result: "not_found" };

/**
 * Journal a scan attempt. The journal IS the audit trail — an accepted
 * gate scan with no event row is unauditable, so insert failures are
 * loud (logged with full context) even though we don't fail the scan
 * itself: the field UX prefers a logged gap over re-banding a guest.
 */
async function logScanEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: {
    assignment_id: string;
    org_id: string;
    actor_user_id: string;
    scan_code_id: string | null;
    result: "accepted" | "duplicate" | "voided" | "not_found" | "expired" | "wrong_zone";
    location: { lat: number; lng: number; accuracy?: number } | null;
  },
): Promise<void> {
  const { error } = await supabase.from("assignment_events").insert({
    assignment_id: row.assignment_id,
    org_id: row.org_id,
    event_kind: "scan",
    actor_user_id: row.actor_user_id,
    scan_code_id: row.scan_code_id,
    result: row.result,
    location: row.location,
  });
  if (error) {
    log.error("assignments.scan_journal_failed", {
      assignment_id: row.assignment_id,
      result: row.result,
      err: error.message,
    });
  }
}

export async function scanAssignment(input: {
  orgId: string;
  scannerUserId: string;
  code: string;
  location?: { lat: number; lng: number; accuracy?: number };
}): Promise<ScanResult> {
  const supabase = await createClient();

  // Active scan code lookup (partial unique index on (org_id, code) WHERE active).
  const { data: scanCode } = await supabase
    .from("assignment_scan_codes")
    .select("id, assignment_id, active")
    .eq("org_id", input.orgId)
    .eq("code", input.code)
    .eq("active", true)
    .maybeSingle();

  if (!scanCode) {
    // Fall back to looking up any code (active or voided) so we can
    // distinguish voided/not_found.
    const { data: anyCode } = await supabase
      .from("assignment_scan_codes")
      .select("id, assignment_id, active")
      .eq("org_id", input.orgId)
      .eq("code", input.code)
      .maybeSingle();
    if (anyCode && !anyCode.active) {
      // Code was voided — log + return voided.
      await logScanEvent(supabase, {
        assignment_id: anyCode.assignment_id,
        org_id: input.orgId,
        actor_user_id: input.scannerUserId,
        scan_code_id: anyCode.id,
        result: "voided",
        location: input.location ?? null,
      });
      return { result: "voided", assignmentId: anyCode.assignment_id };
    }
    return { result: "not_found" };
  }

  // Read the parent assignment to evaluate validity.
  const { data: a } = await supabase
    .from("assignments")
    .select("id, org_id, fulfillment_state, fulfilled_at, catalog_kind, title")
    .eq("id", scanCode.assignment_id)
    .eq("org_id", input.orgId)
    .maybeSingle();
  if (!a) return { result: "not_found" };
  const state = a.fulfillment_state as FulfillmentState;
  const catalogKind = a.catalog_kind as CatalogKind;
  const title = (a.title as string | null) ?? null;

  if (state === "voided") {
    await logScanEvent(supabase, {
      assignment_id: a.id,
      org_id: input.orgId,
      actor_user_id: input.scannerUserId,
      scan_code_id: scanCode.id,
      result: "voided",
      location: input.location ?? null,
    });
    return { result: "voided", assignmentId: a.id };
  }

  if (state === "expired") {
    await logScanEvent(supabase, {
      assignment_id: a.id,
      org_id: input.orgId,
      actor_user_id: input.scannerUserId,
      scan_code_id: scanCode.id,
      result: "expired",
      location: input.location ?? null,
    });
    return { result: "expired", assignmentId: a.id };
  }

  if (state === "redeemed") {
    await logScanEvent(supabase, {
      assignment_id: a.id,
      org_id: input.orgId,
      actor_user_id: input.scannerUserId,
      scan_code_id: scanCode.id,
      result: "duplicate",
      location: input.location ?? null,
    });
    return { result: "duplicate", assignmentId: a.id, redeemedAt: a.fulfilled_at as string | null };
  }

  // Conditional claim — race-safe. We only redeem if the row is still
  // in a redeemable state. Mirrors the old tickets.ts conditional UPDATE.
  const now = new Date().toISOString();
  const { data: claimed } = await supabase
    .from("assignments")
    .update({ fulfillment_state: "redeemed", fulfilled_at: now })
    .eq("id", a.id)
    .eq("org_id", input.orgId)
    .in("fulfillment_state", ["issued", "transferred", "approved", "delivered", "briefed"])
    .select("id, fulfilled_at");

  if (!claimed || claimed.length === 0) {
    // Lost the race — refetch + return duplicate with the canonical timestamp.
    const { data: latest } = await supabase
      .from("assignments")
      .select("fulfilled_at")
      .eq("id", a.id)
      .eq("org_id", input.orgId)
      .maybeSingle();
    await logScanEvent(supabase, {
      assignment_id: a.id,
      org_id: input.orgId,
      actor_user_id: input.scannerUserId,
      scan_code_id: scanCode.id,
      result: "duplicate",
      location: input.location ?? null,
    });
    return { result: "duplicate", assignmentId: a.id, redeemedAt: (latest?.fulfilled_at as string | null) ?? now };
  }

  await logScanEvent(supabase, {
    assignment_id: a.id,
    org_id: input.orgId,
    actor_user_id: input.scannerUserId,
    scan_code_id: scanCode.id,
    result: "accepted",
    location: input.location ?? null,
  });

  return { result: "accepted", assignmentId: a.id, scanCodeId: scanCode.id, catalogKind, title };
}
