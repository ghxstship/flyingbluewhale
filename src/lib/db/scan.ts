import "server-only";

import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { isOutOfScopeForMode, type ScanMode } from "@/lib/scan/formats";
import type { ScanCapability } from "@/lib/rbac/capabilities";
import { classifyGtinScope, isGtinFormat, isUnresolvableCode } from "@/lib/scan/gtin";
import { bindingMatches, posGtinCandidate, productDisplayName } from "@/lib/scan/product";
import type { ProductAdvanceLine, ResolvedScan } from "@/lib/scan/types";
import { CATALOG_KIND_LABEL_SINGULAR, scanAssignment, type CatalogKind } from "./assignments";

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
 *   3. catalog_item_gtins — retail products (kit 30). Only consulted on a
 *      POS-capable surface (`pos`/`any` + scan:product) and only for a code
 *      that normalizes to a valid GTIN. Identification only, like resolver 2:
 *      it also reports the item's open approved advance lines, but the
 *      approved → delivered flip stays behind its own explicit action.
 *   4. miss → scan_unknowns. An unresolved code is data, not silence — and an
 *      unknown GTIN still journals here, which is what feeds the console
 *      bind queue.
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

  // ── Resolver 3: products (org GTIN → catalog item bindings) ─────────────
  // Only a POS-capable surface consults the binding table, and only for a
  // code that IS a well-formed GTIN — an asset tag or wristband payload never
  // reaches it. A GTIN that has no binding falls through to the miss journal
  // below unchanged: the unknown-GTIN path is the console bind queue's feed.
  if ((mode === "pos" || mode === "any") && mayResolve("scan:product")) {
    const product = await resolveProductBinding(input.orgId, input.code);
    if (product) return product;
  }

  // ── Miss ────────────────────────────────────────────────────────────────
  await recordUnknownSafe(input, mode);
  return { result: "not_found", source: "unknown" };
}

/**
 * Resolve a code against the org's `catalog_item_gtins` bindings.
 *
 * Returns the matched catalog item (name as `Kind · Name`) plus its OPEN
 * advance lines — `assignments` rows on this org whose `catalog_item_id`
 * matches and whose `fulfillment_state` is `approved`, hydrated with the
 * party's display name and the project name so the field card can render
 * "Vehicle · Golf Cart · Jack Sparrow · III Points" without more queries.
 *
 * Null on any miss (not a GTIN, no binding, item soft-deleted) so the caller
 * falls through to the miss journal.
 */
async function resolveProductBinding(orgId: string, code: string): Promise<ResolvedScan | null> {
  const gtin14 = posGtinCandidate(code);
  if (!gtin14) return null;

  const supabase = await createClient();
  const { data: binding } = await supabase
    .from("catalog_item_gtins")
    .select("org_id, gtin14, catalog_item_id")
    .eq("org_id", orgId)
    .eq("gtin14", gtin14)
    .maybeSingle();
  // The query already scopes both keys; re-asserting keeps the org boundary a
  // tested property (see bindingMatches).
  if (!binding || !bindingMatches(binding, orgId, gtin14)) return null;

  const { data: item } = await supabase
    .from("master_catalog_items")
    .select("id, name, kind")
    .eq("id", binding.catalog_item_id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!item) return null;

  const kindLabel = CATALOG_KIND_LABEL_SINGULAR[item.kind as CatalogKind] ?? item.kind;
  return {
    result: "product",
    source: "product",
    gtin14,
    matchSource: "catalog_binding",
    catalogItemId: item.id,
    catalogKind: item.kind,
    displayName: productDisplayName(kindLabel, item.name),
    openLines: await listOpenAdvanceLines(supabase, orgId, item.id),
  };
}

/** Approved advance lines for a catalog item, party + project names hydrated. */
async function listOpenAdvanceLines(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  catalogItemId: string,
): Promise<ProductAdvanceLine[]> {
  const { data } = await supabase
    .from("assignments")
    .select("id, title, project_id, party_kind, party_user_id, party_crew_id, party_external_id, deadline")
    .eq("org_id", orgId)
    .eq("catalog_item_id", catalogItemId)
    .eq("fulfillment_state", "approved")
    .is("deleted_at", null)
    .order("deadline", { ascending: true, nullsFirst: false })
    .limit(20);
  const rows = (data ?? []) as Array<{
    id: string;
    title: string | null;
    project_id: string | null;
    party_user_id: string | null;
    party_crew_id: string | null;
    party_external_id: string | null;
    deadline: string | null;
  }>;
  if (rows.length === 0) return [];

  const ids = (vals: Array<string | null>) => [...new Set(vals.filter((v): v is string => Boolean(v)))];
  const userIds = ids(rows.map((r) => r.party_user_id));
  const crewIds = ids(rows.map((r) => r.party_crew_id));
  const externalIds = ids(rows.map((r) => r.party_external_id));
  const projectIds = ids(rows.map((r) => r.project_id));

  const [users, crews, externals, projects] = await Promise.all([
    userIds.length
      ? // soft-delete-exempt: display-name hydration for parties referenced by
        // LIVE assignments — a deactivated user's line still needs its name.
        supabase.from("users").select("id, name, email").in("id", userIds)
      : Promise.resolve({ data: [] }),
    crewIds.length
      ? supabase.from("crew_members").select("id, name").eq("org_id", orgId).in("id", crewIds)
      : Promise.resolve({ data: [] }),
    externalIds.length
      ? supabase
          .from("assignment_external_holders")
          .select("id, holder_name, holder_email")
          .eq("org_id", orgId)
          .in("id", externalIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? // soft-delete-exempt: name hydration for projects referenced by live
        // assignment lines — filtering would blank the label, not hide the line.
        supabase.from("projects").select("id, name").eq("org_id", orgId).in("id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userName = new Map(
    ((users.data ?? []) as Array<{ id: string; name: string | null; email: string }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );
  const crewName = new Map(
    ((crews.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]),
  );
  const externalName = new Map(
    ((externals.data ?? []) as Array<{ id: string; holder_name: string | null; holder_email: string | null }>).map(
      (h) => [h.id, h.holder_name ?? h.holder_email],
    ),
  );
  const projectName = new Map(
    ((projects.data ?? []) as Array<{ id: string; name: string }>).map((p) => [p.id, p.name]),
  );

  return rows.map((r) => ({
    assignmentId: r.id,
    title: r.title,
    partyName:
      (r.party_user_id && userName.get(r.party_user_id)) ||
      (r.party_crew_id && crewName.get(r.party_crew_id)) ||
      (r.party_external_id && externalName.get(r.party_external_id)) ||
      null,
    projectName: (r.project_id && projectName.get(r.project_id)) || null,
    deadline: r.deadline,
  }));
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
