import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";
import { isManagerPlus } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";
import type { UalState } from "@/lib/supabase/types";
import { CHECK_IN, CHECK_OUT, NEXT_UAL_STATES, movementKindFor } from "./assets";

/**
 * Unified Asset Lifecycle transitions — shared by the ATLVS console and
 * COMPVSS.
 *
 * COMPVSS shipped an "Assets" tab (`mobileTabs`) that could read the
 * unified `assets` store and never write it: no custody, no
 * `asset_movements` ledger row, no damage flag. The two surfaces that
 * looked like they closed the loop were both wired to the *assignment*
 * domain instead — the "Scan To Check Out / In" CTA resolved
 * `assignment_scan_codes` (so an `assets.asset_tag` could only ever return
 * not_found), and `/m/coc` reads `assignment_events`, not the asset ledger.
 *
 * Extracted rather than reimplemented because every part of this is
 * load-bearing and easy to get subtly wrong twice: the FSM, the
 * idempotent double-tap, the conditional update that closes the TOCTOU
 * between read and write, the ledger row whose failure must surface (a
 * silent gap in the custody trail is worse than an error), and the audit
 * emit.
 *
 * AUTHORIZATION IS UNCHANGED AND DELIBERATE. `isManagerPlus` is the same
 * gate the console has always enforced: "Only manager+ can move assets".
 * Mirroring it on mobile is parity. Whether CREW may take custody of their
 * own gear is a different question — a new policy, not a port — and it is
 * a product decision, not one to smuggle in behind a refactor. See the
 * audit's G3 entry.
 */

export type AssetTransitionResult = { ok: true } | { ok: false; error: string };

export async function transitionAssetState(
  supabase: SupabaseClient,
  session: Session,
  id: string,
  to: UalState,
  allowedFrom?: readonly UalState[],
): Promise<AssetTransitionResult> {
  if (!isManagerPlus(session)) return { ok: false, error: "Only manager+ can move assets" };

  const { data: row } = await supabase
    .from("assets")
    .select("state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return { ok: false, error: "Asset not found" };

  const current = (row as { state: UalState }).state;

  // Idempotency: a double-tap lands here after the first already moved the
  // asset. On a venue floor with bad signal that is the common case, not
  // the exception — treat it as success rather than shouting.
  if (current === to) return { ok: true };

  if (allowedFrom && !allowedFrom.includes(current)) {
    return { ok: false, error: `Not ${to === "in_use" ? "checkout" : "check-in"}-eligible from ${current}` };
  }
  if (!NEXT_UAL_STATES[current]?.includes(to)) {
    return {
      ok: false,
      error: `Cannot move ${current} → ${to}. Allowed: ${NEXT_UAL_STATES[current]?.join(", ") || "(terminal)"}`,
    };
  }

  // Conditional update closes the TOCTOU between SELECT and write.
  // soft-delete-exempt: state-guarded transition update returning id, not a read
  // (the row was already deleted_at-filtered by the SELECT above).
  const { data: updated, error } = await supabase
    .from("assets")
    .update({ state: to, ...(to === "retired" ? { retired_at: new Date().toISOString() } : {}) })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("state", current)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "Asset state changed concurrently. Refresh and retry" };
  }

  const { error: mvError } = await supabase.from("asset_movements").insert({
    asset_id: id,
    movement_kind: movementKindFor(current, to),
    from_state: current,
    to_state: to,
    recorded_by: session.userId,
  });
  if (mvError) return { ok: false, error: `State moved but ledger write failed: ${mvError.message}` };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: to === "in_use" ? "asset.checked_out" : to === "available" ? "asset.checked_in" : "asset.state_changed",
    targetTable: "assets",
    targetId: id,
    metadata: { fromState: current, toState: to },
  });

  return { ok: true };
}

export const ASSET_CHECK_OUT = CHECK_OUT;
export const ASSET_CHECK_IN = CHECK_IN;
