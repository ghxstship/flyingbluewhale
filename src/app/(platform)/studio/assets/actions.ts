"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { transitionAssetState } from "@/lib/db/asset-transition";
import { UAL_STATES, CHECK_IN, CHECK_OUT } from "@/lib/db/assets";
import type { UalState } from "@/lib/supabase/types";
import { actionErrorMessage } from "@/lib/errors";

const StateEnum = z.enum(UAL_STATES);

function revalidateAssetSurfaces(id?: string) {
  revalidatePath("/studio/assets");
  revalidatePath("/studio/production/equipment");
  revalidatePath("/studio/logistics/warehouse");
  if (id) revalidatePath(`/studio/assets/${id}`);
}

/**
 * Drive the UAL lifecycle on the unified store. Transitions are validated
 * against `NEXT_UAL_STATES` server-side and every accepted move appends an
 * `asset_movements` row (the immutable LDP §3 ledger — RLS forbids
 * update/delete on it). Replaces the retired `setEquipmentStatus`, whose
 * ledger write was shaped against a schema that never shipped and had been
 * silently failing.
 */
export async function setAssetState(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const next = StateEnum.safeParse(formData.get("state"));
  if (!id) throw new Error("Missing asset id");
  if (!next.success) throw new Error("Invalid target state");
  const res = await transitionAsset(id, next.data);
  if (res?.error) throw new Error(res.error);
}

/** Check Out — the kit record action (available/reserved → in_use). */
export async function checkOutAsset(id: string): Promise<{ error?: string } | void> {
  return transitionAsset(id, CHECK_OUT.to, CHECK_OUT.from);
}

/** Check In — the kit record action (in_use/in_transit → available). */
export async function checkInAsset(id: string): Promise<{ error?: string } | void> {
  return transitionAsset(id, CHECK_IN.to, CHECK_IN.from);
}

async function transitionAsset(
  id: string,
  to: UalState,
  allowedFrom?: readonly UalState[],
): Promise<{ error?: string } | void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Gate, FSM, TOCTOU-safe write, ledger and audit all live in the shared
  // transition now, so COMPVSS moves an asset through the identical path
  // instead of a second implementation that drifts.
  const result = await transitionAssetState(supabase, session, id, to, allowedFrom);
  if (!result.ok) return { error: result.error };
  revalidateAssetSurfaces(id);
}

export async function deleteAsset(id: string): Promise<void> {
  const session = await requireSession();
  if (!id) return;
  const supabase = await createClient();
  // Soft-delete via deleted_at — assets are referenced by rentals,
  // daily-log lines, and the movement ledger.
  const { error } = await supabase
    .from("assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete asset: ${error.message}`);
  revalidateAssetSurfaces();
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/** Bulk soft-delete — the list-table counterpart to `deleteAsset`. */
export async function bulkDeleteAssets(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.delete-assets", "You Need Manager Access To Delete Assets") };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: actionErrorMessage("invalid.selection", "Invalid Selection") };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("assets")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { error: `Could Not Delete: ${error.message}` };

  const deleted = updated?.length ?? 0;
  const skipped = parsed.data.length - deleted;
  revalidateAssetSurfaces();
  if (skipped > 0) {
    return { error: `${deleted} Deleted · ${skipped} Skipped (already deleted or not found)` };
  }
  return { message: `${deleted} ${deleted === 1 ? "Item" : "Items"} Deleted` };
}
