import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";
import { can, isManagerPlus } from "@/lib/auth";
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
 * AUTHORIZATION. Two tiers, split by what the move actually means.
 *
 * CUSTODY (check-out → `in_use`, check-in → `available`) is manager+ OR
 * anyone holding the `asset:custody` grant. Crew self-checkout was DECIDED
 * (2026-07-15) as *assignable*, not a global rule — one customer's
 * stagehands self-serve from a cage, another's want a storeman in the loop,
 * and both are right about their own site. ADR-0015's capability-grant layer
 * is that mechanism, and is strictly better than an org-level flag (one was
 * built and reverted): it assigns by role, by person, and for a time window,
 * which is exactly the cover-shift case.
 *
 * EVERYTHING ELSE (retire, write off, maintenance, lost) stays manager+
 * however the grant is assigned. Taking a radio off a shelf is custody;
 * writing off a forklift is not. The grant deliberately cannot reach those —
 * see `ASSET_CAPABILITIES` in @/lib/rbac/capabilities.
 *
 * The gate is on the TARGET state rather than the caller's intent, because
 * the caller's intent is not checkable: `allowedFrom` is an optional
 * argument, so a custody-granted user calling with `to: "retired"` and no
 * `allowedFrom` must still be refused.
 *
 * NOT YET LIVE, and deliberately harmless until it is. `can()` has no grants
 * branch and `resolveGrants` doesn't exist in HEAD (ADR-0015 is "Accepted,
 * partially implemented" — the DATA half is still to land). So today the
 * `can()` arm is always false and this falls through to `isManagerPlus`:
 * exactly the behaviour that shipped, no crew member gains custody. When the
 * resolver lands, this gate starts working with no change here.
 *
 * The grant is administrable now — /studio/settings/capabilities — which was
 * the genuinely missing piece: ADR-0015 shipped enforced but unadministered,
 * both grant tables had zero consumers, so turning a capability on for a
 * customer meant SQL against production.
 */

export type AssetTransitionResult = { ok: true } | { ok: false; error: string };

/**
 * The two moves the `asset:custody` grant may perform. Everything else is
 * manager+ only. Derived from the CHECK_OUT / CHECK_IN targets so this can't
 * drift from the constants the surfaces actually call with.
 */
const CUSTODY_TARGETS: readonly UalState[] = [CHECK_OUT.to, CHECK_IN.to];

export async function transitionAssetState(
  supabase: SupabaseClient,
  session: Session,
  id: string,
  to: UalState,
  allowedFrom?: readonly UalState[],
): Promise<AssetTransitionResult> {
  const isCustodyMove = CUSTODY_TARGETS.includes(to);
  const allowed = isManagerPlus(session) || (isCustodyMove && can(session, "asset:custody"));
  if (!allowed) {
    return {
      ok: false,
      error: isCustodyMove
        ? "You do not have permission to check gear out or in"
        : "Only manager+ can retire or service assets",
    };
  }

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
