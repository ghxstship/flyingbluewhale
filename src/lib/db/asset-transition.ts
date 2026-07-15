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
 * AUTHORIZATION. `isManagerPlus` — the gate the console has always
 * enforced ("Only manager+ can move assets"). Mirroring it on mobile is
 * parity, which is what shipped.
 *
 * CREW SELF-CHECKOUT IS DECIDED BUT NOT BUILT HERE. The product call
 * (2026-07-15) is that it should be *assignable*, not a global rule — one
 * customer's stagehands self-serve from a cage, another's want a storeman
 * in the loop, and both are right about their own site.
 *
 * The mechanism for that is ADR-0015's capability-grant layer
 * (`role_capability_grants` + `user_capability_grants` → `can()`), which is
 * strictly better than an org-level flag: it assigns by role, by person,
 * and for a time window, which is exactly the cover-shift case. Its own ADR
 * says it plainly — "the next add-on feature reuses this rather than
 * growing a second RBAC system" — and this IS the next add-on feature.
 *
 * It is not wired here yet only because `session.grants` is still `[]`
 * (ADR-0015 is "Accepted, partially implemented"). When the resolver lands,
 * the change here is one line:
 *
 *   if (!isManagerPlus(session) && !can(session, "asset:custody")) → refuse
 *
 * plus `asset:custody` in the capability catalog, and it must stay NARROW:
 * check-out and check-in only. Retire and maintenance remain manager+
 * however the grant is assigned — taking a radio off a shelf is custody;
 * writing off a forklift is not.
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
