"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { emitAudit } from "@/lib/audit";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { Database } from "@/lib/supabase/database.types";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

function toMinor(usd: string | undefined): number | null {
  if (!usd) return null;
  const n = Math.round(Number(usd) * 100);
  return Number.isFinite(n) ? n : null;
}

/** Confirm the asset belongs to the caller's org before touching its
 *  (org_id-less) child tables. Returns the asset id or null. */
async function assertOrgAsset(orgId: string, assetId: string): Promise<string | null> {
  const asset = await getOrgScoped("assets", orgId, assetId);
  return asset ? assetId : null;
}

const DepreciationSchema = z.object({
  asset_id: z.string().uuid(),
  method: z.enum(["straight_line", "declining_balance"]),
  useful_life_months: z.coerce.number().int().min(1).max(1200),
  salvage_value_usd: z.string().optional().or(z.literal("")),
  start_at: z.string().min(1),
});

export async function addDepreciation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit depreciation" };
  const parsed = DepreciationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const assetId = await assertOrgAsset(session.orgId, parsed.data.asset_id);
  if (!assetId) return actionFail("Asset not found", fd);

  const salvage = toMinor(parsed.data.salvage_value_usd) ?? 0;
  const supabase = await createClient();
  const { error } = await supabase.from("asset_depreciation_schedule").insert({
    asset_id: assetId,
    method: parsed.data.method,
    useful_life_months: parsed.data.useful_life_months,
    salvage_value_minor: salvage,
    start_at: parsed.data.start_at,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/assets/${assetId}`);
  return { ok: true };
}

type UalState = Database["public"]["Enums"]["ual_state"];

export type RecordActionState = { error?: string } | null;

/**
 * Shared spine for the v7.8 "Check Out" / "Check In" record actions.
 * Conditional update (`.eq("state", current)`) closes the TOCTOU between
 * the gate read and the write; the asset_movements append is the LDP §3
 * UAL ledger row (from_state → to_state) that the asset timeline reads.
 */
async function transitionAssetState(
  assetId: string,
  allowedFrom: readonly UalState[],
  toState: UalState,
  movementKind: "checkout" | "return",
  auditAction: "asset.checked_out" | "asset.checked_in",
): Promise<RecordActionState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can move assets" };

  const supabase = await createClient();
  const { data: asset, error: loadError } = await supabase
    .from("assets")
    .select("id, state")
    .eq("org_id", session.orgId)
    .eq("id", assetId)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!asset) return { error: "Asset not found" };

  const current = asset.state;
  // Idempotency: a double-click lands here after the first click already
  // moved the asset — treat as success rather than shouting at the user.
  if (current === toState) return null;
  if (!allowedFrom.includes(current)) {
    return { error: `Asset must be ${allowedFrom.join(" or ")} (currently ${current})` };
  }

  const { data: updated, error: updateError } = await supabase
    .from("assets")
    .update({ state: toState })
    .eq("org_id", session.orgId)
    .eq("id", assetId)
    .eq("state", current)
    .select("id");
  if (updateError) return { error: updateError.message };
  if (!updated || updated.length === 0) {
    return { error: "Asset state changed concurrently. Refresh and retry." };
  }

  // Append to the asset_movements ledger — best-effort, matching the
  // equipment actions convention: a ledger write failure shouldn't roll
  // back the transition (the asset row already moved), but the gap is a
  // visible timeline cue that something's off.
  await supabase.from("asset_movements").insert({
    asset_id: assetId,
    movement_kind: movementKind,
    from_state: current,
    to_state: toState,
    recorded_by: session.userId,
  });

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: auditAction,
    targetTable: "assets",
    targetId: assetId,
    metadata: { fromState: current, toState },
  });

  revalidatePath(`/studio/assets/${assetId}`);
  revalidatePath("/studio/assets");
  return null;
}

/**
 * v7.8 record action — "Check Out". An idle asset (available, reserved,
 * or freshly acquired) goes into service: state → in_use, with a
 * `checkout` movement row on the UAL ledger.
 */
export async function checkOutAssetAction(assetId: string): Promise<RecordActionState> {
  return transitionAssetState(assetId, ["available", "reserved", "acquired"], "in_use", "checkout", "asset.checked_out");
}

/**
 * v7.8 record action — "Check In". An asset in the field (in_use or
 * in_transit) comes home: state → available, with a `return` movement
 * row on the UAL ledger.
 */
export async function checkInAssetAction(assetId: string): Promise<RecordActionState> {
  return transitionAssetState(assetId, ["in_use", "in_transit"], "available", "return", "asset.checked_in");
}

const MaintenanceSchema = z.object({
  asset_id: z.string().uuid(),
  performed_at: z.string().min(1),
  outcome: z.string().min(1).max(200),
  cost_usd: z.string().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function addMaintenance(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can log maintenance" };
  const parsed = MaintenanceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const assetId = await assertOrgAsset(session.orgId, parsed.data.asset_id);
  if (!assetId) return actionFail("Asset not found", fd);

  const cost = toMinor(parsed.data.cost_usd);
  const supabase = await createClient();
  const { error } = await supabase.from("asset_maintenance_history").insert({
    asset_id: assetId,
    performed_at: parsed.data.performed_at,
    outcome: parsed.data.outcome,
    cost_minor: cost,
    cost_currency: cost != null ? "USD" : null,
    notes: parsed.data.notes || null,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/assets/${assetId}`);
  return { ok: true };
}
