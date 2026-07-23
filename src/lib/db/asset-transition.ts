import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";
import { can, isManagerPlus } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";
import type { UalState } from "@/lib/supabase/types";
import { CHECK_IN, CHECK_OUT, NEXT_UAL_STATES, custodianPatchFor, movementKindFor } from "./assets";
import { ensureMyPartyId } from "./parties";

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
 * LIVE end to end. The grants resolver (`resolveGrants` in @/lib/auth) rides
 * `public.effective_capabilities`, and migration `20260723120000` mirrors the
 * gate at the DB (F1, MOBILE_BEST_PRACTICES_2026-07): `assets_custody_update`
 * admits a custody-granted member's state flip, and the ledger INSERT arms
 * are actor-bound — the manager band records any movement it makes itself;
 * the custody grant records only its own handoff, custodian = its own party.
 * The grant is administrable at /studio/settings/capabilities.
 *
 * LEDGER SHAPE. Custody moves stamp the actor's `parties` row on the
 * movement (`custodianPatchFor`): checkout takes possession
 * (`to_custodian_id`), a check-in from the field releases it
 * (`from_custodian_id`). A ledger row that never named the custodian could
 * not answer "who has the radio" — that was the F1 hole. `recorded_by`
 * remains the auth actor; the custodian columns are the party-canon custody
 * chain. Both writes are read back per the RLS canon: an RLS no-op returns
 * no error, so success is only what the returned row proves.
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

  // Custody moves name the custodian party BEFORE the state flips: the
  // field-custody RLS arm requires the custodian to be the caller's own
  // party, so failing to resolve one must abort while the asset is still
  // untouched — not after, where it would strand a flipped state with no
  // ledger row. Managers may proceed unstamped (their ledger arm doesn't
  // require a custodian and a party row may predate this feature).
  let custodian: ReturnType<typeof custodianPatchFor> = {};
  if (isCustodyMove) {
    const partyId = await ensureMyPartyId(session.orgId, session.userId, session.email);
    if (!partyId && !isManagerPlus(session)) {
      return { ok: false, error: "Could not resolve your workspace identity for the custody record" };
    }
    custodian = custodianPatchFor(current, to, partyId);
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

  // Read the ledger row back (`.select("id")`): a WITH CHECK refusal errors
  // loudly, but the RLS canon is to trust only the returned row — a custody
  // trail that silently skipped the handoff is worse than a surfaced error.
  // soft-delete-exempt: INSERT returning its own row, not a read.
  const { data: mvRows, error: mvError } = await supabase
    .from("asset_movements")
    .insert({
      asset_id: id,
      movement_kind: movementKindFor(current, to),
      from_state: current,
      to_state: to,
      recorded_by: session.userId,
      ...custodian,
    })
    .select("id");
  if (mvError) return { ok: false, error: `State moved but ledger write failed: ${mvError.message}` };
  if (!mvRows || mvRows.length === 0) {
    return { ok: false, error: "State moved but the custody ledger write did not land — report this" };
  }

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
