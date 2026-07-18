import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

/**
 * Party resolution — the ONE place auth users are translated into `parties`
 * rows before a write touches a `*_party_id` column.
 *
 * Every `*_party_id` column holds a `parties.id`, never an auth uid, a
 * `clients.id`, or a `vendors.id`. The two id spaces are both uuids, so
 * nothing about the value betrays the mistake — the 2026-07-17 FK/3NF audit
 * found 100+ live rows across 15 tables carrying raw entity ids because write
 * paths skipped this translation. The party FK layer (migration
 * `party_layer_repair_and_fks`) now rejects the class at write time; these
 * helpers are how a write path produces a value that passes.
 *
 * A membership does NOT imply a party: nothing provisions one at signup, so
 * most members have no row until a party-keyed feature first attributes
 * something to them. Write paths therefore get-or-create; read paths should
 * use `getMyPartyId` and tolerate null — rendering a page is no reason to
 * write to the database.
 */

/** The raw, un-memoized party read. The get-or-create write paths below use
 *  this directly so their reads always see the latest state (a memoized read
 *  could return a pre-insert `null` and defeat the post-race re-read). */
async function readMyPartyId(orgId: string, authUserId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parties")
    .select("id")
    .eq("org_id", orgId)
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * The caller's `parties.id` in `orgId`, or null when none exists. Read-only.
 *
 * `React.cache`-wrapped: a single render can resolve the caller's party from
 * several surfaces, and this dedupes those repeated reads to one query per
 * request. Only the READ path is cached — the get-or-create helpers below run
 * the uncached `readMyPartyId` so a write path never observes a stale value.
 */
export const getMyPartyId = cache(readMyPartyId);

/**
 * The caller's `parties.id` in `orgId`, creating the row if they don't have
 * one. Being an org member IS the authority to hold a party there — exactly
 * what the `uis_parties_org` RLS policy says — and this creates the caller's
 * OWN row, never anyone else's. Returns null only when both the insert and
 * the post-race re-read fail (e.g. the caller isn't a member of `orgId`).
 */
export async function ensureMyPartyId(orgId: string, authUserId: string, email: string): Promise<string | null> {
  const existing = await readMyPartyId(orgId, authUserId);
  if (existing) return existing;

  const supabase = await createClient();
  // soft-delete-exempt: an INSERT whose .select("id") returns the row just
  // written, not a read — there is no archived row it could surface.
  const { data, error } = await supabase
    .from("parties")
    .insert({
      org_id: orgId,
      type: "person",
      // Best available identity: parties.display_name is NOT NULL and the
      // session carries only an email. A real name overwrites this later.
      display_name: email.split("@")[0] || email,
      auth_user_id: authUserId,
      primary_email: email,
    })
    .select("id")
    .single();
  if (error) {
    // Lost a race against a concurrent create (or another surface made one
    // first) — re-read rather than fail the caller's actual work. Uncached:
    // the memoized read may still hold the pre-insert null.
    return readMyPartyId(orgId, authUserId);
  }
  return data.id;
}

/**
 * A fellow MEMBER's `parties.id` in `orgId`, creating the row if they don't
 * have one. For manager+ flows that attribute a record to someone else
 * (contract parties/signatures, approval delegatees). The membership check is
 * the org boundary: a uuid that isn't a live member of `orgId` resolves to
 * null and the caller must refuse — mapping an outsider would plant a foreign
 * tenant's identity in this org's records.
 */
export async function ensurePartyForMember(orgId: string, targetUserId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(email, name)")
    .eq("org_id", orgId)
    .eq("user_id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return null;

  const existing = await supabase
    .from("parties")
    .select("id")
    .eq("org_id", orgId)
    .eq("auth_user_id", targetUserId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing.data) return existing.data.id;

  const u = member.users as unknown as { email: string; name: string | null } | null;
  const email = u?.email ?? "";
  // soft-delete-exempt: INSERT returning its own row — see ensureMyPartyId.
  const { data, error } = await supabase
    .from("parties")
    .insert({
      org_id: orgId,
      type: "person",
      display_name: u?.name || email.split("@")[0] || "Member",
      auth_user_id: targetUserId,
      primary_email: email || null,
    })
    .select("id")
    .single();
  if (error) {
    const raced = await supabase
      .from("parties")
      .select("id")
      .eq("org_id", orgId)
      .eq("auth_user_id", targetUserId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!raced.data) {
      // A silent null here surfaces to callers as "not a member of this
      // workspace" — which is a LIE when the person IS a member and the
      // insert failed for another reason. The 2026-07-17 prod e2e chased
      // exactly that phantom (direct REST insert succeeded 201 while this
      // path nulled). Log the truth so the next occurrence names itself.
      log.warn("parties.ensure_for_member_failed", {
        org_id: orgId,
        target_user_id: targetUserId,
        err: error.message,
        code: error.code,
      });
    }
    return raced.data?.id ?? null;
  }
  return data.id;
}
