"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { emitAudit } from "@/lib/audit";
import { NEXT_FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";
import { normalizeGtin } from "@/lib/scan/gtin";

export type ConfirmFulfillmentState = { error?: string; ok?: true } | null;

const ConfirmSchema = z.object({ assignmentId: z.string().uuid() });

/**
 * Confirm Fulfillment (kit 30) — the POS product-match card's per-line action.
 *
 * Flips ONE approved advance line to `delivered` through the same
 * FSM-enforcing path as the studio `advanceState` / mobile `fulfillAssignment`
 * actions: manager+ gate, server-side `NEXT_FULFILLMENT_STATES` validation,
 * CAS on the prior state so a stale card can't double-apply, and one
 * `assignment_events` state_change row. On top of the shared pattern it
 * records the fulfillment provenance the kit 30 schema added:
 * `fulfilled_at` / `fulfilled_by` / `fulfilled_via = 'scan'`.
 *
 * The transition target is fixed — `delivered` is reachable only from
 * `approved` in the state machine, so validating the map IS validating that
 * this line was an open approved advance.
 */
export async function confirmProductFulfillment(
  _prev: ConfirmFulfillmentState,
  fd: FormData,
): Promise<ConfirmFulfillmentState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You need manager access to confirm fulfillment" };
  const parsed = ConfirmSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const supabase = await createClient();
  const { data: a } = await supabase
    .from("assignments")
    .select("id, title, catalog_kind, party_kind, party_user_id, fulfillment_state")
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!a) return { error: "Advance line not found" };

  const cur = a.fulfillment_state as FulfillmentState;
  if (!NEXT_FULFILLMENT_STATES[cur]?.includes("delivered")) {
    return { error: "This line is not awaiting fulfillment" };
  }

  const { data: updated, error: upErr } = await supabase
    .from("assignments")
    .update({
      fulfillment_state: "delivered",
      fulfilled_at: new Date().toISOString(),
      fulfilled_by: session.userId,
      fulfilled_via: "scan",
    })
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId)
    .eq("fulfillment_state", cur) // optimistic concurrency
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (upErr) return { error: upErr.message };
  if (!updated) return { error: "State changed elsewhere, reload and rescan" };

  const { error: evErr } = await supabase.from("assignment_events").insert({
    assignment_id: parsed.data.assignmentId,
    org_id: session.orgId,
    event_kind: "state_change",
    actor_user_id: session.userId,
    from_state: cur,
    to_state: "delivered",
  });
  if (evErr) return { error: evErr.message };

  if (a.party_kind === "user" && a.party_user_id && a.party_user_id !== session.userId) {
    void writeInbox({
      userId: a.party_user_id,
      orgId: session.orgId,
      kind: "assignment_state",
      sourceType: "assignments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: "Assignment Fulfilled",
      body: a.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath("/m/check-in");
  revalidatePath("/m/advances");
  return { ok: true };
}

export type BindGtinState = { error?: string; ok?: true } | null;

const BindSchema = z.object({
  /** The scanned code as submitted — any GTIN width; normalized server-side. */
  code: z.string().trim().min(1).max(64),
  catalogItemId: z.string().uuid(),
});

/**
 * Bind To Catalog Item (kit 30) — teach the org that a GTIN is one of its
 * catalog items, so the next POS scan of that code resolves instead of
 * journaling a miss.
 *
 * Upserts `catalog_item_gtins` (PK `(org_id, gtin14)`; canonical GTIN-14 via
 * `normalizeGtin`) and best-effort resolves the matching `scan_unknowns` row.
 * Manager-band per the handoff (`people:manage`), matching the RLS write
 * policy on the table.
 */
export async function bindGtinToCatalogItem(_prev: BindGtinState, fd: FormData): Promise<BindGtinState> {
  const session = await requireSession();
  if (!isManagerPlus(session) && !can(session, "people:manage")) {
    return { error: "You need manager access to bind product codes" };
  }
  const parsed = BindSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };

  const normalized = normalizeGtin(parsed.data.code);
  if (!normalized.ok) return { error: "That code is not a valid product barcode" };
  const gtin14 = normalized.gtin14;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("master_catalog_items")
    .select("id, name, kind")
    .eq("id", parsed.data.catalogItemId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!item) return { error: "Catalog item not found" };

  const { error: upsertErr } = await supabase.from("catalog_item_gtins").upsert(
    {
      org_id: session.orgId,
      gtin14,
      catalog_item_id: item.id,
      bound_by: session.userId,
      bound_at: new Date().toISOString(),
    },
    { onConflict: "org_id,gtin14" },
  );
  if (upsertErr) return { error: upsertErr.message };

  // Best-effort: close the miss-journal row for the raw code. A failure here
  // must not fail the bind — the binding is the fact; the queue row is
  // bookkeeping a manager can still resolve by hand.
  await supabase
    .from("scan_unknowns")
    .update({ resolved_at: new Date().toISOString(), resolved_by: session.userId })
    .eq("org_id", session.orgId)
    .eq("code", parsed.data.code)
    .is("resolved_at", null);

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "catalog_gtin.bound",
    targetTable: "catalog_item_gtins",
    targetId: item.id,
    metadata: { gtin14, catalogItemId: item.id, catalogItemName: item.name, catalogKind: item.kind },
  });

  revalidatePath("/m/check-in");
  revalidatePath("/studio/settings/capabilities/scan-misses");
  return { ok: true };
}
