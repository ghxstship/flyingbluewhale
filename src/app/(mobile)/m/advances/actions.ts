"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MANAGER_BAND_ROLES, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { log } from "@/lib/log";
import type { CatalogKind } from "@/lib/db/assignments";
import type { Json } from "@/lib/supabase/database.types";

export type State = { error?: string; ok?: boolean } | null;

// The kit `advance` form maps Category → a catalog kind family. We map the
// human category onto the canonical `catalog_kind` enum.
const CATEGORY_TO_KIND: Record<string, CatalogKind> = {
  Credential: "credential",
  Radio: "radio",
  Earpiece: "radio",
  "Meal Voucher": "catering",
  Parking: "vehicle",
  Other: "equipment",
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const Input = z.object({
  cat: z.string().min(1, "Category is required."),
  type: z.string().min(1, "Item / Type is required."),
  qty: z.coerce.number().int().positive().optional(),
  // Kit 31 (live-test resolution #4): every advance line carries its window.
  start: z.string().regex(DATE, "Start date is required."),
  end: z.string().regex(DATE, "End date is required."),
  special: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  // Kit 31 (live-test resolution #3): the catalog's "Add To Request" CTA
  // hands the concrete SKU through so the request binds to it directly
  // instead of find-or-creating by name.
  catalogItemId: z.string().uuid().optional().or(z.literal("")),
});

/**
 * Author an advance request: ensure a `master_catalog_items` SKU exists for
 * the requested item, then insert an `assignments` row for the requester in
 * `fulfillment_state` "briefed" (the advance arc's entry state). Managers
 * are push-notified.
 */
export async function requestAdvance(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please fix the errors below." };
  }
  const { cat, type, qty, start, end, special, purpose, notes, catalogItemId } = parsed.data;
  if (end < start) {
    return { error: "End date can't be before the start date." };
  }
  let kind: CatalogKind = CATEGORY_TO_KIND[cat] ?? "equipment";

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

  // Resolve the catalog SKU. A CTA-supplied id (catalog → Add To Request)
  // binds directly; otherwise find-or-create org-scoped by kind+name.
  let itemId: string | null = null;
  if (catalogItemId) {
    const { data: picked } = await supabase
      .from("master_catalog_items")
      .select("id, kind")
      .eq("id", catalogItemId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!picked) return { error: "That catalog item is no longer available." };
    itemId = picked.id as string;
    // The SKU is the SSOT for its kind — the category select is display-side.
    kind = picked.kind as CatalogKind;
  }

  if (!itemId) {
    const { data: existing } = await supabase
      .from("master_catalog_items")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("kind", kind)
      .ilike("name", type)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    itemId = (existing?.id as string | undefined) ?? null;
  }

  if (!itemId) {
    const code = `${kind.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    // soft-delete-exempt: insert-returning chain — never reads existing rows.
    const { data: created, error: catErr } = await supabase
      .from("master_catalog_items")
      .insert({ org_id: session.orgId, kind, code, name: type })
      .select("id")
      .single();
    if (catErr || !created) {
      log.error("m.advances.catalog_create_failed", { err: catErr?.message });
      return { error: catErr?.message ?? "Could not create the catalog item." };
    }
    itemId = created.id as string;
  }

  const data: { [key: string]: Json } = {};
  if (qty) data.qty = qty;
  if (special) data.special = special;
  if (purpose) data.purpose = purpose;
  if (notes) data.notes = notes;
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
      catalog_kind: kind,
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
  if (kind === "catering") {
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
