#!/usr/bin/env node
/**
 * Purge E2E create-flow residue from the shared test fixtures.
 *
 * The create-flow specs (booking co-pro, vendor→PO, /me/availability, …) insert
 * rows into SHARED fixtures (the demo/professional org, the owner test user, the
 * fixed co-pro offer) and can't reliably delete them via the UI when prod
 * throttles the remove step. Left unchecked they ACCUMULATE across runs until
 * they hit an intentional app cap and (correctly) break the next run:
 *   - co_pro_partnerships saturate the ≤100% split cap → new adds rejected;
 *   - vendors exceed the listOrgScoped 100-row cap → the newest falls out of the
 *     PO vendor dropdown;
 *   - availability_slots pile up under the owner.
 * This script deletes ONLY the E2E-tagged residue, RLS-scoped as the owner
 * fixture user (no service-role key needed — runs from `.env.local` alone). It
 * runs automatically as the Playwright globalTeardown after every suite, so each
 * completed run wipes ALL accumulated residue (including from prior killed runs).
 * Run it manually with `npm run e2e:clean`.
 *
 * Every table/column below is verified; add a row to TARGETS to cover a new
 * create-flow fixture. FK note: purchase_orders.vendor_id is ON DELETE SET NULL,
 * so deleting an E2E vendor safely nulls any bound PO rather than erroring.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const envtxt = (() => {
  try {
    return readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return "";
  }
})();
const get = (k) => process.env[k] || envtxt.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();

const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const ANON = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const OWNER_EMAIL = "test+owner@flyingbluewhale.app";
const OWNER_PASSWORD = "FlyingBlue!Test2026";

// Each entry: the table, the text column carrying the E2E label, and the
// `LIKE` pattern that matches ONLY test-created rows. Keep patterns specific.
const TARGETS = [
  { table: "co_pro_partnerships", column: "partner_name", pattern: "E2E CoPro%" },
  { table: "vendors", column: "name", pattern: "E2E Vendor%" },
  { table: "availability_slots", column: "label", pattern: "E2E hold%" },
  // project-roles.spec creates a throwaway project to exercise PROJECT_ROLES
  // assignment; project_members cascade on delete. RLS scopes the delete to the
  // owner fixture's test orgs.
  { table: "projects", column: "name", pattern: "E2E ProjectRoles%" },
  // Kit 27 scheduler residue (advance-engine-deep.spec). Bookings BEFORE event
  // types: scheduler_bookings.event_type_id is ON DELETE RESTRICT.
  { table: "scheduler_bookings", column: "invitee_email", pattern: "e2e-book-%" },
  { table: "scheduler_event_types", column: "name", pattern: "E2E Scheduler%" },
  // Sales & CRM behavioral coverage (atlvs-sales-crm-coverage.spec). Proposals
  // BEFORE leads — a lead→proposal conversion titles the proposal "Proposal for
  // <lead>", and clearing the derived record first keeps the purge FK-safe.
  { table: "proposals", column: "title", pattern: "Proposal for E2E Lead%" },
  { table: "leads", column: "title", pattern: "E2E Lead%" },
];

// The deterministic marketplace talent fixture the e2e suite reads
// (e2e/marketplace-canon-actions). Mirrors migration
// 20260630174035_reseed_marketplace_talent_fixture — kept in sync by hand.
const TALENT_FIXTURE = {
  id: "aaaaaaaa-0001-4001-8001-000000000001",
  org_id: "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7",
  user_id: "781d6818-5f1b-4b41-b5a7-aa3b2cf1732a",
  created_by: "781d6818-5f1b-4b41-b5a7-aa3b2cf1732a",
  public_handle: "fixture-band-alpha-pro",
  act_name: "Fixture Band Alpha",
  tagline: "Deterministic e2e marketplace fixture.",
  is_public: true,
};

/**
 * Self-heal the marketplace talent fixture. The marketplace-canon mutation
 * tests create "E2E Act …" talent and demote/rename/delete the shared fixture,
 * which left the deterministic detail-page tests reading E2E residue instead of
 * "Fixture Band Alpha". This purges the residue and restores the fixture.
 *
 * No service role needed: the fixture + residue live in the test-professional
 * org (f4509a5f) and `talent_profiles` insert/update/delete RLS all admit
 * `is_org_member(org_id)`, of which the owner fixture is a member — so the
 * already-authenticated owner client can do it. Each step is isolated +
 * best-effort so a partial failure never blocks the restore.
 */
async function healMarketplaceFixture(supabase) {
  // 1. Purge "E2E Act …" residue (talent_offers reference acts → offers first).
  try {
    const { data: acts } = await supabase
      .from("talent_profiles")
      .select("id")
      .like("act_name", "E2E Act%")
      .neq("id", TALENT_FIXTURE.id);
    const ids = (acts ?? []).map((a) => a.id);
    if (ids.length) {
      // FK children of talent_profiles.id: talent_offers + tours are RESTRICT
      // (delete first); agency_artists + talent_riders CASCADE. Columns are
      // `talent_profile_id`.
      await supabase.from("talent_offers").delete().in("talent_profile_id", ids);
      await supabase.from("tours").delete().in("talent_profile_id", ids);
      const { data: removed, error } = await supabase.from("talent_profiles").delete().in("id", ids).select("id");
      if (error) throw error;
      console.log(`e2e:clean — talent_profiles: removed ${removed?.length ?? 0} "E2E Act%" row(s)`);
    }
  } catch (e) {
    console.error(`e2e:clean — talent residue purge (ignored): ${e?.message ?? e}`);
  }
  // 2. Restore the fixture (idempotent upsert), un-demoting + un-deleting it.
  try {
    const { error } = await supabase
      .from("talent_profiles")
      .upsert({ ...TALENT_FIXTURE, verified_at: new Date().toISOString(), deleted_at: null }, { onConflict: "id" });
    if (error) throw error;
    console.log('e2e:clean — talent fixture "Fixture Band Alpha" restored.');
  } catch (e) {
    console.error(`e2e:clean — talent fixture restore (ignored): ${e?.message ?? e}`);
  }
}

/**
 * Reset the owner fixture's sidebar nav lens to the "All" default. The lens
 * persists to user_preferences.ui_state.nav_lens the moment a human clicks
 * the sidebar Lens selector in a dev session; a stale non-default value
 * (e.g. "Crew") filters the rail and breaks tests that assert default
 * group visibility (booking-canon "Bookings group surfaces in primary
 * sidebar"). No e2e test sets the lens, so a one-time clear is durable —
 * this is belt-and-suspenders so the fixture heals itself on every run.
 */
async function resetOwnerNavLens(supabase, userId) {
  try {
    const { data: pref } = await supabase
      .from("user_preferences")
      .select("ui_state")
      .eq("user_id", userId)
      .maybeSingle();
    const ui = pref?.ui_state;
    if (ui && typeof ui === "object" && "nav_lens" in ui) {
      const next = { ...ui };
      delete next.nav_lens;
      await supabase.from("user_preferences").update({ ui_state: next }).eq("user_id", userId);
      console.log("e2e:clean — owner nav_lens reset to default.");
    }
  } catch (e) {
    console.error(`e2e:clean — nav_lens reset (ignored): ${e?.message ?? e}`);
  }
}

/**
 * Purge the kit-27 advance-engine residue (advance-engine-deep.spec). The
 * whole packet graph on the fixture project — sections, audiences, section
 * assignments, send batches, recipients, submissions, deadline events —
 * hangs off `advance_packets` with ON DELETE CASCADE, so one delete wipes
 * the run. The go-live step also seeds four chase-ladder automations
 * (subscribed to the deleted packet's id, so they'd be dead weight);
 * purge those by their seeded names.
 */
const FIXTURE_PROJECT_ID = "f62d1228-dd83-49bf-baa4-b82242bd3056";
async function purgeAdvanceEngine(supabase) {
  try {
    const { data: removed, error } = await supabase
      .from("advance_packets")
      .delete()
      .eq("project_id", FIXTURE_PROJECT_ID)
      .select("id");
    if (error) throw error;
    if (removed?.length) {
      console.log(`e2e:clean — advance_packets: removed ${removed.length} fixture-project packet(s) (cascade).`);
    }
  } catch (e) {
    console.error(`e2e:clean — advance packet purge (ignored): ${e?.message ?? e}`);
  }
  try {
    const { data: ladders } = await supabase
      .from("automations")
      .select("id, name")
      .or("name.like.Advance Chase · %,name.like.Advance Confirm · %");
    const ids = (ladders ?? []).map((a) => a.id);
    if (ids.length) {
      // Children of automations.id: subscriptions/schedules/runs. Best-effort
      // pre-delete in case any FK is RESTRICT rather than CASCADE.
      await supabase.from("automation_subscriptions").delete().in("automation_id", ids);
      await supabase.from("automation_schedules").delete().in("automation_id", ids);
      const { data: removed, error } = await supabase.from("automations").delete().in("id", ids).select("id");
      if (error) throw error;
      console.log(`e2e:clean — automations: removed ${removed?.length ?? 0} seeded chase-ladder row(s).`);
    }
  } catch (e) {
    console.error(`e2e:clean — chase ladder purge (ignored): ${e?.message ?? e}`);
  }
}

async function main() {
  if (!SUPABASE_URL || !ANON) {
    console.error("e2e:clean — missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY; skipping.");
    return;
  }
  const supabase = createClient(SUPABASE_URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (authErr) {
    console.error(`e2e:clean — owner sign-in failed (${authErr.message}); skipping cleanup.`);
    return;
  }
  const ownerId = authData?.user?.id;
  if (ownerId) await resetOwnerNavLens(supabase, ownerId);

  let total = 0;
  for (const { table, column, pattern } of TARGETS) {
    // `.select("id")` makes the deleted rows come back so we can count them;
    // RLS scopes the delete to what the owner may remove (own + org rows).
    const { data, error } = await supabase.from(table).delete().like(column, pattern).select("id");
    if (error) {
      console.error(`e2e:clean — ${table}: ${error.message}`);
      continue;
    }
    const n = data?.length ?? 0;
    total += n;
    if (n) console.log(`e2e:clean — ${table}: removed ${n} "${pattern}" row(s)`);
  }
  console.log(`e2e:clean — done (${total} residual row(s) removed).`);

  // Restore the shared marketplace fixture the mutation tests clobber. Runs on
  // the still-authenticated owner client (org member of the fixture org).
  await healMarketplaceFixture(supabase);
  // Kit 27 — wipe the advance-engine graph + seeded chase ladder.
  await purgeAdvanceEngine(supabase);
  await supabase.auth.signOut();
}

main().catch((e) => {
  // Best-effort: never fail the run on cleanup trouble.
  console.error(`e2e:clean — unexpected error (ignored): ${e?.message ?? e}`);
});
