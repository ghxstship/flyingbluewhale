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
  { table: "opportunities", column: "title", pattern: "E2E Lead%" },
  // Sales & CRM behavioral coverage extensions (atlvs-sales-crm-coverage.spec):
  // derived/child rows BEFORE their parents for FK safety.
  { table: "beo_line_items", column: "name", pattern: "E2E Line %" },
  { table: "beos", column: "event_name", pattern: "E2E BEO %" },
  { table: "budgets", column: "name", pattern: "E2E Estimate %" }, // convert names the budget after the estimate
  { table: "estimates", column: "name", pattern: "E2E Estimate %" },
  { table: "clients", column: "name", pattern: "E2E Client %" },
  { table: "function_bookings", column: "title", pattern: "E2E Booking %" },
  { table: "function_spaces", column: "name", pattern: "E2E Space %" },
  // Remaining behavioral-coverage domains (talent/projects/procurement/production/
  // people/ops/safety/finance/governance/compvss/gvteway/legend/personal). Leaf/
  // child records first; shared parents (events, projects) LAST for FK safety.
  { table: "open_calls", column: "title", pattern: "E2E Call%" },
  { table: "rfqs", column: "title", pattern: "E2E ReqRFQ %" },
  { table: "requisitions", column: "title", pattern: "E2E ReqRFQ %" },
  { table: "purchase_orders", column: "title", pattern: "E2E PO %" },
  // NOTE: `assets` is NOT here — four FKs block a bare delete. See purgeE2EAssets.
  { table: "fabrication_orders", column: "title", pattern: "E2E Fab%" },
  { table: "sheet_sets", column: "name", pattern: "E2E Sheet Set%" },
  { table: "cues", column: "label", pattern: "E2E Cue%" },
  { table: "work_orders", column: "title", pattern: "E2E Work Order%" },
  { table: "badge_awards", column: "note", pattern: "E2E Award%" },
  { table: "badges", column: "name", pattern: "E2E Badge%" },
  { table: "new_hire_flow_steps", column: "title", pattern: "E2E Step%" },
  { table: "new_hire_flows", column: "name", pattern: "E2E Flow%" },
  { table: "teams", column: "name", pattern: "E2E Team%" },
  { table: "invites", column: "email", pattern: "e2e-invite-%@test.example" },
  { table: "org_roles", column: "label", pattern: "E2E Role%" },
  { table: "credentials", column: "kind", pattern: "E2E Cred%" },
  { table: "crew_members", column: "name", pattern: "E2E Crew%" },
  { table: "rosters", column: "name", pattern: "E2E Roster%" },
  { table: "reservations", column: "guest_name", pattern: "E2E Reservation%" },
  { table: "venue_tables", column: "table_no", pattern: "E2E-T-%" },
  { table: "tasks", column: "title", pattern: "Corrective action: E2E Incident%" },
  { table: "incidents", column: "summary", pattern: "E2E Incident%" },
  { table: "inspections", column: "name", pattern: "E2E Inspection%" },
  { table: "crisis_alerts", column: "title", pattern: "E2E Crisis%" },
  { table: "project_billing_draws", column: "draw_name", pattern: "E2E Draw%" },
  { table: "invoices", column: "title", pattern: "E2E Invoice%" },
  { table: "invoices", column: "title", pattern: "E2E Vendor Invoice%" },
  { table: "expenses", column: "description", pattern: "E2E Expense%" },
  { table: "budgets", column: "name", pattern: "E2E Budget%" },
  { table: "wip_snapshots", column: "notes", pattern: "E2E WIP%" },
  { table: "messages", column: "body_markdown", pattern: "E2E Channel Msg%" },
  { table: "message_channels", column: "name", pattern: "E2E Channel%" },
  { table: "approval_delegations", column: "scope_ref", pattern: "E2E Delegation%" },
  { table: "approval_policies", column: "name", pattern: "E2E Policy%" },
  { table: "governance_committees", column: "name", pattern: "E2E Committee%" },
  { table: "governance_policies", column: "name", pattern: "E2E GovPolicy%" },
  { table: "announcements", column: "title", pattern: "E2E Announcement%" },
  { table: "polls", column: "question", pattern: "E2E Poll%" },
  { table: "surveys", column: "title", pattern: "E2E Survey%" },
  { table: "handovers", column: "summary", pattern: "E2E Handover %" },
  { table: "marketplace_listings", column: "title", pattern: "E2E Listing %" },
  { table: "time_off_requests", column: "reason", pattern: "E2E TimeOff %" },
  { table: "proposal_revision_rounds", column: "title", pattern: "E2E Revision%" },
  { table: "accreditations", column: "person_name", pattern: "E2E Applicant%" },
  { table: "community_comments", column: "body_html", pattern: "E2E Reply%" },
  { table: "community_posts", column: "title", pattern: "E2E Legend Post%" },
  { table: "compliance_findings", column: "detail", pattern: "%E2E Rule%" },
  { table: "compliance_rules", column: "code", pattern: "E2E-RULE-%" },
  { table: "opportunities", column: "title", pattern: "E2E Contact %" },
  { table: "partner_integrations", column: "name", pattern: "E2E Integration %" },
  // COMPVSS field mutations (compvss-field-mutations.spec). field_templates is
  // standalone (org CASCADE / project SET NULL); archive is soft-delete, so a
  // hard DELETE by name is needed to clear soft-deleted rows too. shifts are the
  // draft seats the scheduler create test inserts (no clock-in → free to drop).
  { table: "field_templates", column: "name", pattern: "E2E Template%" },
  { table: "shifts", column: "role", pattern: "E2E %" },
  // LEG3ND manage-flow residue (legend-manage-flows.spec). Hard deletes as the
  // owner fixture (in-band on every legend write policy); children cascade:
  // courses → lessons/assessments/questions/enrollments, sessions →
  // registrations, certifications → holders → recert requests, crews →
  // memberships. Products/vouchers have no dependents (redemptions keep their
  // ledger rows via SET NULL-free append-only design — the spec never redeems
  // its own mints). The spec's afterAll purges these too; this is the safety
  // net for runs killed before afterAll.
  { table: "legend_courses", column: "title", pattern: "E2E Course %" },
  { table: "legend_live_sessions", column: "title", pattern: "E2E Session %" },
  { table: "legend_certifications", column: "code", pattern: "E2E-CT-%" },
  { table: "legend_certifications", column: "code", pattern: "E2E-RC-%" },
  { table: "credit_products", column: "name", pattern: "E2E Store Item %" },
  { table: "vouchers", column: "code", pattern: "E2EV%" },
  { table: "legend_crews", column: "name", pattern: "E2E Crew %" },
  // LEG3ND Organization Hub coverage (legend-hub-coverage.spec). Positions
  // cascade their position_assignments; cost centers are referenced only via
  // ON DELETE SET NULL FKs; locations cascade their venue_geofences (the spec
  // deletes its location in-test — this is the mid-failure backstop).
  { table: "positions", column: "title", pattern: "E2E Position%" },
  { table: "cost_centers", column: "name", pattern: "E2E Cost Center%" },
  { table: "locations", column: "name", pattern: "E2E Location%" },
  // /legend/start walkthrough (legend-start-walkthrough.spec). The spec's own
  // teardown purges these; this is the mid-failure backstop.
  { table: "positions", column: "title", pattern: "E2E Walk Position %" },
  { table: "locations", column: "name", pattern: "E2E Walk Venue %" },
  { table: "master_catalog_items", column: "code", pattern: "e2e-walk-%" },
  { table: "invites", column: "email", pattern: "e2e-walk-%@example.com" },
  // Shared parents LAST — children above must clear first (ON DELETE RESTRICT).
  { table: "events", column: "name", pattern: "E2E Event %" },
  { table: "events", column: "name", pattern: "E2E Activity%" },
  { table: "projects", column: "name", pattern: "E2E Project %" },
  { table: "projects", column: "name", pattern: "E2E Reservation%" },
  { table: "projects", column: "name", pattern: "E2E FinanceDraws%" },
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
/**
 * Restore the viewer fixture's Starter-org membership.
 *
 * lifecycle-invite-accept.spec drives a deliberate round-trip: the viewer LEAVES
 * the Starter org, gets re-invited, and the accept restores the membership — so
 * a completed run is idempotent. A mid-chain failure (before the accept) would
 * strand the viewer OUT of the org and break the next run's precondition, so we
 * un-soft-delete it here. Same self-heal contract as the marketplace talent
 * fixture. No-ops when the membership is already live.
 */
async function healViewerStarterMembership(supabase) {
  const VIEWER_EMAIL = "test+viewer@flyingbluewhale.app";
  const STARTER_ORG = "0443cdf4-384c-44ea-8de7-25e5de77d2c8";
  const { data: viewer, error: uErr } = await supabase
    .from("users")
    .select("id")
    .eq("email", VIEWER_EMAIL)
    .maybeSingle();
  if (uErr || !viewer) {
    if (uErr) console.error(`e2e:clean — viewer lookup: ${uErr.message}`);
    return;
  }
  const { data: restored, error } = await supabase
    .from("memberships")
    .update({ deleted_at: null })
    .eq("user_id", viewer.id)
    .eq("org_id", STARTER_ORG)
    .not("deleted_at", "is", null)
    .select("id");
  if (error) {
    console.error(`e2e:clean — viewer Starter membership: ${error.message}`);
    return;
  }
  if (restored?.length) console.log(`e2e:clean — restored the viewer fixture's Starter-org membership`);
}

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

/**
 * Purge the "Route To Approvals" residue (atlvs-procurement-coverage.spec). Each
 * PO / PO change-order route opens an `approval_instances` row (subject_table +
 * subject_id, NO FK back to the PO), so deleting the E2E PO leaves the instance
 * orphaned — it can't be caught by the subject-table TARGETS loop. The route
 * action stamps `metadata.title` with the PO/CO title ("E2E …"), so match on that
 * jsonb path. Deletable by the owner client via the admin DELETE policy added in
 * 20260714120000_approval_instances_write_rls.sql (owner = is_org_admin).
 */
async function purgeApprovalInstances(supabase) {
  try {
    const { data, error } = await supabase
      .from("approval_instances")
      .delete()
      .in("subject_table", ["purchase_orders", "po_change_orders"])
      .like("metadata->>title", "E2E %")
      .select("id");
    if (error) throw error;
    if (data?.length) console.log(`e2e:clean — approval_instances: removed ${data.length} "E2E %" route row(s).`);
  } catch (e) {
    console.error(`e2e:clean — approval_instances purge (ignored): ${e?.message ?? e}`);
  }
}

/**
 * Purge the E2E `assets` residue. This can't ride the TARGETS loop: `assets` is
 * the unified physical-asset store (kit 20 Phase A), and of the 13 FKs pointing
 * at it, four do NOT cascade — `event_resources` (RESTRICT) plus `rentals`,
 * `goods_receipt_lines` and `uqm_incidents` (NO ACTION). A bare delete therefore
 * dies on the first dependent (in practice `rentals_asset_id_fkey`) and every
 * "E2E Asset%" row survives the run. The other nine FKs are ON DELETE CASCADE or
 * SET NULL and need no help here.
 *
 * So: resolve the E2E asset ids, clear the four non-cascading dependents, then
 * delete the assets. Each step is best-effort — a dependent the owner client
 * can't see under RLS shouldn't abort the rest of the cleanup.
 *
 * Derived from the live schema, not assumed; re-check with:
 *   SELECT conrelid::regclass, confdeltype FROM pg_constraint
 *   WHERE contype='f' AND confrelid='public.assets'::regclass;
 */
const ASSET_BLOCKING_DEPENDENTS = ["event_resources", "rentals", "goods_receipt_lines", "uqm_incidents"];
async function purgeE2EAssets(supabase) {
  try {
    const { data: rows, error: findErr } = await supabase
      .from("assets")
      .select("id")
      .like("display_name", "E2E Asset%");
    if (findErr) throw findErr;
    const ids = (rows ?? []).map((r) => r.id);
    if (!ids.length) return;

    for (const table of ASSET_BLOCKING_DEPENDENTS) {
      try {
        const { error } = await supabase.from(table).delete().in("asset_id", ids);
        if (error) throw error;
      } catch (e) {
        console.error(`e2e:clean — assets dependent ${table} (ignored): ${e?.message ?? e}`);
      }
    }

    const { data: removed, error } = await supabase.from("assets").delete().in("id", ids).select("id");
    if (error) throw error;
    if (removed?.length) console.log(`e2e:clean — assets: removed ${removed.length} "E2E Asset%" row(s).`);
  } catch (e) {
    console.error(`e2e:clean — assets purge (ignored): ${e?.message ?? e}`);
  }
}

/**
 * Kit 30 — the jack-sparrow lifecycle cast. Their names don't fit the "E2E
 * Crew%" TARGETS pattern, and `offer_letters.crew_member_id` is ON DELETE
 * RESTRICT, so the contracts (and their onboarding packets, which cascade
 * from the letter) must go before the crew rows can.
 */
const LIFECYCLE_CAST_PATTERNS = [
  "E2E Jack Sparrow%",
  "E2E Captain America%",
  "E2E Spiderman%",
  "E2E Wonder Woman%",
  // roster-engagement-lifecycle.spec + compvss-field-mutations mobile assign:
  // each assigned person carries an offer_letter (crew_member_id RESTRICT), so
  // they MUST purge letters-first via this cast block, not the bare crew TARGET.
  "E2E Recruit%",
  "E2E Skipper%",
];

async function purgeLifecycleCast(supabase) {
  try {
    const ids = [];
    for (const pattern of LIFECYCLE_CAST_PATTERNS) {
      const { data, error } = await supabase.from("crew_members").select("id").like("name", pattern);
      if (error) throw error;
      ids.push(...(data ?? []).map((r) => r.id));
    }
    if (!ids.length) return;

    // The cart test advances real assignments to the cast, and the
    // crew_member_has_dependents guard refuses deleting crew with history —
    // clear the advance residue first (owner-band hard delete; the per-kind
    // detail siblings and events cascade from assignments).
    const { error: assignErr } = await supabase.from("assignments").delete().in("party_crew_id", ids);
    if (assignErr) console.error(`e2e:clean — lifecycle assignments (ignored): ${assignErr.message}`);
    const { error: letterErr } = await supabase.from("offer_letters").delete().in("crew_member_id", ids);
    if (letterErr) console.error(`e2e:clean — lifecycle offer_letters (ignored): ${letterErr.message}`);
    const { data: removed, error } = await supabase.from("crew_members").delete().in("id", ids).select("id");
    if (error) throw error;
    if (removed?.length) console.log(`e2e:clean — lifecycle cast: removed ${removed.length} crew row(s).`);
  } catch (e) {
    console.error(`e2e:clean — lifecycle cast purge (ignored): ${e?.message ?? e}`);
  }
}

/**
 * LEG3ND hub coverage (legend-hub-coverage.spec) — heal the two settings
 * overlays the spec round-trips, in case a mid-test failure stranded them:
 *   • org_doc_template_settings: the doc-type configurator test disables a
 *     type then restores it. A stranded enabled=false row hides that type
 *     from /studio/documents and breaks documents-v6.spec's "every template
 *     link renders" sweep. The fixture orgs carry no legit disables, so
 *     deleting enabled=false rows restores the registry default (enabled).
 *   • org_xpms_atom_settings: the atom-label test sets then clears an
 *     "E2E Atom Label …" override; clear any stranded ones.
 * RLS scopes both deletes to the orgs the owner fixture can write.
 */
async function healLegendHubOverlays(supabase) {
  try {
    const { data, error } = await supabase
      .from("org_doc_template_settings")
      .delete()
      .eq("enabled", false)
      .select("id");
    if (error) throw error;
    if (data?.length) console.log(`e2e:clean — org_doc_template_settings: re-enabled ${data.length} doc type(s).`);
  } catch (e) {
    console.error(`e2e:clean — doc-template settings heal (ignored): ${e?.message ?? e}`);
  }
  try {
    const { data, error } = await supabase
      .from("org_xpms_atom_settings")
      .update({ org_label: null })
      .like("org_label", "E2E Atom Label%")
      .select("id");
    if (error) throw error;
    if (data?.length) console.log(`e2e:clean — org_xpms_atom_settings: cleared ${data.length} E2E label override(s).`);
  } catch (e) {
    console.error(`e2e:clean — atom-label heal (ignored): ${e?.message ?? e}`);
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
  // Put the viewer back in the Starter org if the lifecycle round-trip stranded them.
  await healViewerStarterMembership(supabase);
  // Kit 27 — wipe the advance-engine graph + seeded chase ladder.
  await purgeAdvanceEngine(supabase);
  // Route-to-approvals — wipe orphaned approval_instances (no FK back to the PO).
  await purgeApprovalInstances(supabase);
  // Unified assets — clear the four non-cascading dependents, then the assets.
  await purgeE2EAssets(supabase);
  // Kit 30 — the jack-sparrow cast (offer_letters RESTRICT before crew rows).
  await purgeLifecycleCast(supabase);
  // LEG3ND hub — un-strand the doc-configurator + atom-label overlays.
  await healLegendHubOverlays(supabase);
  await supabase.auth.signOut();
}

main().catch((e) => {
  // Best-effort: never fail the run on cleanup trouble.
  console.error(`e2e:clean — unexpected error (ignored): ${e?.message ?? e}`);
});
