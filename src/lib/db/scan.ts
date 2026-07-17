import "server-only";

import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { isOutOfScopeForMode, type ScanMode } from "@/lib/scan/formats";
import type { ScanCapability } from "@/lib/rbac/capabilities";
import { classifyGtinScope, isGtinFormat, isUnresolvableCode } from "@/lib/scan/gtin";
import type { ResolvedScan } from "@/lib/scan/types";
import { scanAssignment } from "./assignments";

/**
 * The scan resolver chain — one entry point, ordered attempts, first hit wins.
 *
 * WHY THIS EXISTS: the app had two resolve domains and picked between them by
 * hardcoded endpoint at the call site, incorrectly. `/m/inventory/scan` calls
 * itself the "asset check-out / check-in scanner", takes asset tags, and posted
 * them to `/api/v1/scan` — which only ever consulted `assignment_scan_codes`.
 * So an `assets.asset_tag` came back `not_found` unless someone had *also*
 * minted an assignment scan code for it. Meanwhile `/api/v1/equipment/scan`,
 * which does resolve `assets.asset_tag`, had no client caller at all.
 * (SCANNING_UNIVERSAL_CAPTURE_PLAN.md D1/D2.)
 *
 * The fix is to resolve by IDENTITY, not by endpoint: the code — plus its
 * symbology — decides which store answers.
 *
 * Order is deliberate:
 *   1. assignment_scan_codes — entitlements. Narrowest, most authoritative,
 *      and the only resolver that may answer an `access` surface.
 *   2. assets.asset_tag — gear/fleet/lots. READ-ONLY here; see below.
 *   3. miss → scan_unknowns. An unresolved code is data, not silence.
 *
 * ── Why resolver 2 does not toggle state ──────────────────────────────────
 * `/api/v1/equipment/scan` toggles `assets.state` between available/in_use and
 * is gated on `projects:write`. This chain runs behind `check-in:write`, which
 * `member` and the `crew` persona hold (auth.ts:373, :403) and which `crew`
 * conspicuously does NOT have for `projects:*`. Folding the toggle in here
 * would silently grant every crew member asset-state mutation — a privilege
 * escalation dressed up as a bug fix. So resolver 2 IDENTIFIES an asset and
 * stops. Mutation stays behind its own capability and its own explicit action.
 */

export type { ResolvedScan } from "@/lib/scan/types";

/**
 * Record a code that resolved against nothing.
 *
 * This is the only place an unresolved scan becomes visible. `assignment_events`
 * cannot hold it — `assignment_id` is NOT NULL and an unknown code has no
 * parent — which is why `scanAssignment()` has always returned `not_found`
 * silently. Failures here are logged, never thrown: a miss-journal problem must
 * not turn a scan into an error in the operator's face.
 */
async function recordUnknown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: { orgId: string; code: string; format?: string; mode: ScanMode; scannerUserId: string },
): Promise<void> {
  // Upsert on (org_id, code): a repeat miss increments rather than duplicating,
  // which is what makes the queue rankable ("seen 40 times, still unknown").
  const { error } = await supabase.rpc("bump_scan_unknown", {
    p_org_id: input.orgId,
    p_code: input.code,
    p_format: input.format,
    p_mode: input.mode,
    p_actor: input.scannerUserId,
  });
  if (error) {
    log.error("scan.unknown_journal_failed", { code_len: input.code.length, err: error.message });
  }
}

/**
 * Resolve a scanned code against every store that could own it.
 *
 * `mode` constrains rather than routes: `access` restricts to resolver 1 so a
 * gate can never accept a retail barcode or an asset tag.
 */
export async function resolveScan(input: {
  orgId: string;
  scannerUserId: string;
  code: string;
  format?: string;
  mode?: ScanMode;
  /** Threaded to the assignment journal — a gate scan's location is audit data. */
  location?: { lat: number; lng: number; accuracy?: number };
  /**
   * The scan capabilities the CALLER actually holds. Narrows the chain so a
   * resolver can only answer for a domain the caller is entitled to.
   *
   * Undefined means "unrestricted" — for internal callers that have already
   * gated. The route always passes it.
   */
  allowed?: readonly ScanCapability[];
}): Promise<ResolvedScan> {
  const mode: ScanMode = input.mode ?? "any";
  const mayResolve = (c: ScanCapability) => !input.allowed || input.allowed.includes(c);

  // Out-of-scope symbology for this surface — refuse before touching a store.
  if (isOutOfScopeForMode(mode, input.format)) {
    return { result: "not_found", source: "unknown" };
  }

  // ── Resolver 1: entitlements ────────────────────────────────────────────
  // Skipped entirely for a caller without scan:credential — a warehouse hand
  // scanning in `any` mode must not have a gate pass resolved for them, and
  // must not journal a scan attempt against someone's credential.
  if (mayResolve("scan:credential")) {
    const assignment = await scanAssignment({
      orgId: input.orgId,
      scannerUserId: input.scannerUserId,
      code: input.code,
      location: input.location,
    });
    if (assignment.result !== "not_found") {
      return { ...assignment, source: "assignment" };
    }
  }

  // An access surface gets exactly one resolver. A credential that isn't in
  // the entitlement table is not found — it is emphatically not "maybe it's a
  // forklift".
  if (mode === "access") {
    await recordUnknownSafe(input, mode);
    return { result: "not_found", source: "unknown" };
  }

  // ── Resolver 2: assets (read-only identification) ───────────────────────
  if (mayResolve("scan:asset")) {
    const supabase = await createClient();
    const { data: asset } = await supabase
      .from("assets")
      .select("id, display_name, asset_tag, state")
      .eq("org_id", input.orgId)
      .eq("asset_tag", input.code)
      .is("deleted_at", null)
      .maybeSingle();

    if (asset) {
      return {
        result: "asset",
        source: "asset",
        assetId: asset.id,
        displayName: asset.display_name ?? null,
        assetTag: asset.asset_tag ?? null,
        state: (asset.state as string | null) ?? null,
      };
    }
  }

  // ── Miss ────────────────────────────────────────────────────────────────
  await recordUnknownSafe(input, mode);
  return { result: "not_found", source: "unknown" };
}

/**
 * recordUnknown with its own client + a hard guarantee it never throws.
 *
 * Skips codes that no database could ever resolve. A retailer's internal RCN,
 * a variable-weight deli label (the digits encode THAT package's price), an
 * ISBN, or a coupon is not a product we failed to find — it is not a global
 * product identifier at all, and no amount of chasing or licensing will make
 * it one. Recording those would fill the work queue with un-actionable rows
 * and corrupt the single number this table exists to produce: how many real
 * retail codes we actually fail to resolve.
 */
async function recordUnknownSafe(
  input: { orgId: string; scannerUserId: string; code: string; format?: string },
  mode: ScanMode,
): Promise<void> {
  if (isGtinFormat(input.format) && isUnresolvableCode(input.code)) {
    log.info("scan.unresolvable_code_skipped", { scope: classifyGtinScope(input.code), mode });
    return;
  }
  try {
    const supabase = await createClient();
    await recordUnknown(supabase, {
      orgId: input.orgId,
      code: input.code,
      format: input.format,
      mode,
      scannerUserId: input.scannerUserId,
    });
  } catch (err) {
    log.error("scan.unknown_journal_threw", { err: err instanceof Error ? err.message : String(err) });
  }
}
