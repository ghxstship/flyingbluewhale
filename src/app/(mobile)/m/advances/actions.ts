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

const Input = z.object({
  cat: z.string().min(1, "Category is required."),
  type: z.string().min(1, "Item / Type is required."),
  qty: z.coerce.number().int().positive().optional(),
  needed: z.string().optional(),
  special: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
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
  const { cat, type, qty, needed, special, purpose, notes } = parsed.data;
  const kind: CatalogKind = CATEGORY_TO_KIND[cat] ?? "equipment";

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

  // Find-or-create the catalog SKU for this item (org-scoped, by kind+name).
  let catalogItemId: string | null = null;
  const { data: existing } = await supabase
    .from("master_catalog_items")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("kind", kind)
    .ilike("name", type)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  catalogItemId = (existing?.id as string | undefined) ?? null;

  if (!catalogItemId) {
    const code = `${kind.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const { data: created, error: catErr } = await supabase
      .from("master_catalog_items")
      .insert({ org_id: session.orgId, kind, code, name: type })
      .select("id")
      .single();
    if (catErr || !created) {
      log.error("m.advances.catalog_create_failed", { err: catErr?.message });
      return { error: catErr?.message ?? "Could not create the catalog item." };
    }
    catalogItemId = created.id as string;
  }

  const data: { [key: string]: Json } = {};
  if (qty) data.qty = qty;
  if (special) data.special = special;
  if (purpose) data.purpose = purpose;
  if (notes) data.notes = notes;

  const { error: insErr } = await supabase.from("assignments").insert({
    org_id: session.orgId,
    project_id: projectId,
    catalog_item_id: catalogItemId,
    catalog_kind: kind,
    party_kind: "user",
    party_user_id: session.userId,
    fulfillment_state: "briefed",
    title: type,
    notes: purpose || notes || null,
    deadline: needed ? new Date(needed).toISOString() : null,
    data,
    created_by: session.userId,
  });
  if (insErr) {
    log.error("m.advances.insert_failed", { err: insErr.message });
    return { error: insErr.message };
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
