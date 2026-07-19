"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MANAGER_BAND_ROLES, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { log } from "@/lib/log";
import { CATALOG_KINDS, type CatalogKind } from "@/lib/db/assignments";
import type { Json } from "@/lib/supabase/database.types";

export type State = { error?: string; ok?: boolean } | null;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const Input = z.object({
  // The form now sends the canonical `catalog_kind` directly (the Category
  // select is driven by the real catalog kinds), not a display label.
  kind: z
    .string()
    .refine((k): k is CatalogKind => (CATALOG_KINDS as readonly string[]).includes(k), "Pick a valid category."),
  type: z.string().min(1, "Item is required.").max(200),
  qty: z.coerce.number().int().positive().optional(),
  // Kit 31 (live-test resolution #4): every advance line carries its window.
  start: z.string().regex(DATE, "Start date is required."),
  end: z.string().regex(DATE, "End date is required."),
  special: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  // Normal path: the request binds directly to an existing, active catalog
  // SKU picked from the category-filtered lookup.
  catalogItemId: z.string().uuid().optional().or(z.literal("")),
  // Escape hatch: "1" when the crew flags a special order for an item that
  // isn't in the catalog. We mint an INACTIVE SKU (pending manager approval)
  // rather than let a typo pollute the standard catalog.
  special_order: z.string().optional(),
});

/**
 * Author an advance request. Two paths:
 *
 *  - **Catalog (strict):** binds the `assignments` row to an existing,
 *    active `master_catalog_items` SKU selected from the category-filtered
 *    lookup. No find-or-create — an unknown name can't silently spawn a SKU.
 *  - **Special order:** the crew asked for something not in the catalog. We
 *    create the backing SKU with `active = false` (it satisfies the NOT NULL
 *    FK and stays out of the standard lookup until a manager approves it),
 *    then bind the assignment to it.
 *
 * Either way the assignment lands in `fulfillment_state` "briefed" (the
 * advance arc's entry state) and managers are push-notified.
 */
export async function requestAdvance(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please fix the errors below." };
  }
  const { kind, type, qty, start, end, special, purpose, notes, catalogItemId, special_order } = parsed.data;
  if (end < start) {
    return { error: "End date can't be before the start date." };
  }
  const isSpecialOrder = special_order === "1" || special_order === "true";

  const supabase = await createClient();

  // Resolve the target project: prefer the requester's most recent
  // assignment's project, else the org's most recent project.
  let projectId: string | null = null;
  const { data: mine } = await supabase
    .from("assignments")
    .select("project_id")
    .eq("org_id", session.orgId)
    .eq("party_user_id", session.userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  projectId = (mine?.project_id as string | undefined) ?? null;
  if (!projectId) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectId = (proj?.id as string | undefined) ?? null;
  }
  if (!projectId) {
    return { error: "No project available to request against." };
  }

  // Resolve the catalog SKU + its authoritative kind.
  let itemId: string;
  let itemKind: CatalogKind = kind;

  if (isSpecialOrder) {
    // Item isn't in the catalog — mint an INACTIVE SKU so it satisfies the
    // NOT NULL FK but stays out of the standard lookup until a manager
    // approves it (flips `active`). The request detail rides `description`.
    const code = `SPECIAL-${kind.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    // soft-delete-exempt: insert-returning chain — never reads existing rows.
    const { data: created, error: catErr } = await supabase
      .from("master_catalog_items")
      .insert({
        org_id: session.orgId,
        kind,
        code,
        name: type,
        active: false,
        is_special_order: true,
        description: special || purpose || notes || null,
      })
      .select("id")
      .single();
    if (catErr || !created) {
      log.error("m.advances.special_order_create_failed", { err: catErr?.message });
      return { error: catErr?.message ?? "Could not file the special-order request." };
    }
    itemId = created.id as string;
  } else {
    // Strict catalog binding — the SKU must exist and be active.
    if (!catalogItemId) {
      return { error: "Pick an item from the catalog, or submit it as a special order." };
    }
    const { data: picked } = await supabase
      .from("master_catalog_items")
      .select("id, kind")
      .eq("id", catalogItemId)
      .eq("org_id", session.orgId)
      .eq("active", true)
      .is("deleted_at", null)
      .maybeSingle();
    if (!picked) return { error: "That catalog item is no longer available." };
    itemId = picked.id as string;
    // The SKU is the SSOT for its kind — the category select is display-side.
    itemKind = picked.kind as CatalogKind;
  }

  const data: { [key: string]: Json } = {};
  if (qty) data.qty = qty;
  if (special) data.special = special;
  if (purpose) data.purpose = purpose;
  if (notes) data.notes = notes;
  if (isSpecialOrder) data.special_order = true;
  // The advance window rides the sanctioned per-kind jsonb, same shape the
  // ATLVS cart writes (starts_on/ends_on) so every queue reads one contract.
  data.starts_on = start;
  data.ends_on = end;

  // soft-delete-exempt: insert-returning chain — never reads existing rows.
  const { data: createdAssignment, error: insErr } = await supabase
    .from("assignments")
    .insert({
      org_id: session.orgId,
      project_id: projectId,
      catalog_item_id: itemId,
      catalog_kind: itemKind,
      party_kind: "user",
      party_user_id: session.userId,
      fulfillment_state: "briefed",
      title: type,
      notes: purpose || notes || null,
      deadline: end,
      data,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insErr || !createdAssignment) {
    log.error("m.advances.insert_failed", { err: insErr?.message });
    return { error: insErr?.message ?? "Could not submit the request." };
  }

  // Catering keeps its structured sibling row (kit 30) so the fulfillment
  // queue and roster advance cards derive meal summaries from one store.
  if (itemKind === "catering") {
    const { error: detailErr } = await supabase.from("catering_assignment_details").insert({
      assignment_id: createdAssignment.id as string,
      meal_periods: [],
      starts_on: start,
      ends_on: end,
      every_contract_day: false,
      excluded_dates: [],
    });
    if (detailErr) {
      // The line itself landed — don't fail the request over the sibling.
      log.error("m.advances.catering_detail_failed", { err: detailErr.message });
    }
  }

  // Notify managers (owner/admin/manager) so they can action the request.
  const { data: managers } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .in("role", [...MANAGER_BAND_ROLES]);
  const managerIds = (managers ?? [])
    .map((m) => m.user_id as string)
    .filter((u) => u && u !== session.userId);
  if (managerIds.length > 0) {
    await sendPushBulk(managerIds, {
      title: "New advance request",
      body: `${type} requested`,
      url: "/m/advances",
      kind: "assignment",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/advances");
  return { ok: true };
}
