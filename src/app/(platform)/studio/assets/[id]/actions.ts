"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { actionFail, formFail } from "@/lib/forms/fail";

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

// `outcome` is a constrained result on asset_maintenance_history
// (CHECK completed|failed|deferred) — NOT a free-text description. The
// human-readable detail ("Replaced capsule; passed bench test") belongs in
// `notes`. Validate the enum here so a bad value fails as a field error
// instead of a raw DB check-constraint violation.
const MaintenanceSchema = z.object({
  asset_id: z.string().uuid(),
  performed_at: z.string().min(1),
  outcome: z.enum(["completed", "failed", "deferred"]),
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
