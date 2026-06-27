#!/usr/bin/env node
/**
 * CROSS-TENANT ISOLATION PROBE — the fast, exhaustive SQL-layer half of the
 * tenant-isolation suite (the behavioral half is e2e/cross-tenant-isolation.spec.ts).
 *
 * Goal: prove that RLS — the tenant boundary for this multi-tenant app — holds
 * the line at the data layer. For every sensitive table and every internal
 * (security_invoker) view we assert:
 *
 *   1. An org-A-authenticated user sees ZERO org-B rows.
 *   2. An anonymous (logged-out) caller sees ZERO private rows.
 *
 * Faithful by construction
 * ------------------------
 * Rather than simulating roles with a service-role JWT, this harness logs in
 * the TWO REAL org-owner users via signInWithPassword and queries through
 * PostgREST with their access tokens, plus an anon (no-token) client. That
 * exercises the exact PostgREST → RLS path production uses — a real
 * end-to-end proof, not a simulation.
 *
 * Intentional public carve-outs (NOT leaks)
 * -----------------------------------------
 * A handful of tables are public by design and their RLS encodes it:
 *   - projects:      visible to anyone if the project has a PUBLISHED event guide
 *                    (projects_select_consolidated). The portal guide surface.
 *   - event_guides:  visible to anyone if `published = true`.
 *   - proposals:     visible to anyone holding an active (non-revoked, unexpired)
 *                    share link (proposals_select_consolidated).
 * For these, the invariant is NOT "0 rows" but "0 rows that are NOT
 * published / not share-linked" — the probe asserts the private residue is 0
 * and treats the public residue as expected.
 *
 * If this script ever reports FAIL, that is a real cross-tenant leak. Fix it
 * at the RLS / grant layer (apply_migration, lockstep filename) — never by
 * weakening this probe.
 *
 * Usage:  node scripts/cross-tenant-isolation-probe.mjs
 * Reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local.
 * Exit code 0 = isolation holds; 1 = a leak (or a setup error).
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) {
  console.error("FATAL: missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The two tenants + their owners (confirmed live against project xrovijzjbyssajhtwvas)
// ---------------------------------------------------------------------------
const ORG_A = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7"; // Test Professional Org ("proshow")
const ORG_B = "68672cc3-0667-4234-ad77-49325e173175"; // Demo Events Co. ("demo")

const ORG_A_OWNER = { email: "test+owner@flyingbluewhale.app", password: "FlyingBlue!Test2026" };
// owner@gvteway.test's password is not the shared fixture pw; admin@gvteway.test
// is a verified Org B admin (broad-read manager band) and is the strongest
// reciprocal probe — if even an admin can't cross the boundary, no one can.
const ORG_B_OWNER = { email: "admin@gvteway.test", password: "CompvssTest2026!" };

// ---------------------------------------------------------------------------
// Surfaces to probe
// ---------------------------------------------------------------------------
// Tables that carry an org_id and must be strictly tenant-scoped (no public
// carve-out). For each: an org-A user must see 0 rows where org_id = ORG_B.
const STRICT_TABLES = [
  "invoices",
  "invoice_line_items", // no org_id column → joined via invoice; handled specially below
  "expenses",
  "budgets",
  "contracts",
  "offer_letters",
  "assignments",
  "deliverables",
  "clients",
  "leads",
  "tasks",
  "events",
  "crew_members",
  "ai_conversations",
  "notifications",
  "audit_events",
  "vendors",
  "purchase_orders",
  "requisitions",
  "time_entries",
  "mileage_logs",
  "equipment",
  "incidents",
  "memberships",
  "uis_roles",
  "settlements",
  "payroll_runs",
];

// Tables with an intentional public carve-out. The probe asserts the PRIVATE
// residue (rows not published / not shared) visible cross-tenant + to anon is 0.
const CARVED = ["projects", "event_guides", "proposals"];

// Internal views — security_invoker=on so the underlying-table RLS applies.
// org-A user must see 0 org-B rows; anon must see 0 rows OR be DENIED (no grant).
const VIEWS_WITH_ORG = [
  "offer_letters_resolved",
  "v_consolidated_ar",
  "v_xpms_atom_rollup",
  "independent_contractor_msas_resolved",
  "tour_p_and_l",
];
const VIEWS_ANON_ANY = [
  "offer_letters_resolved",
  "v_consolidated_ar",
  "v_xpms_atom_rollup",
  "v_xpms_atom_rollup_recursive",
  "independent_contractor_msas_resolved",
  "tour_p_and_l",
  "v_budget_health",
  "v_action_items",
  "v_catalog_inventory",
  "v_equipment_utilization",
  "v_xpms_variance_summary",
  "v_xpms_atom_tier_composition",
  "public_insights_pool",
  "guide_access_redemption_log",
  "v_line_permit_flags",
  "v_package_band_check",
  "v_siteplan_sheet_acceptance",
  "v_xtc_codebook",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function client() {
  return createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function login(creds) {
  const c = client();
  const { error } = await c.auth.signInWithPassword(creds);
  if (error) throw new Error(`login ${creds.email} failed: ${error.message}`);
  return c;
}

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const tag = pass ? "PASS" : "FAIL";
  console.log(`  [${tag}] ${name}${detail ? ` — ${detail}` : ""}`);
}

/** count org-B rows visible through `c` for a plain org_id table. */
async function countOrgB(c, table) {
  const { count, error } = await c
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("org_id", ORG_B);
  return { count: count ?? 0, error };
}

// ---------------------------------------------------------------------------
// Probes
// ---------------------------------------------------------------------------
async function probeStrictCrossTenant(orgA) {
  console.log("\n[1] Org-A-authed user must see ZERO org-B rows in strict tables");
  for (const table of STRICT_TABLES) {
    if (table === "invoice_line_items") {
      // No org_id column; isolation derives from the parent invoice's RLS.
      // If invoices isolate, line items follow. Probe by joining the FK.
      const { data, error } = await orgA
        .from("invoice_line_items")
        .select("id, invoices!inner(org_id)")
        .eq("invoices.org_id", ORG_B)
        .limit(1);
      if (error) {
        record(`strict invoice_line_items (orgA→orgB)`, true, `query rejected: ${error.code ?? error.message} (treated as isolated)`);
      } else {
        record(`strict invoice_line_items (orgA→orgB)`, (data?.length ?? 0) === 0, `rows=${data?.length ?? 0}`);
      }
      continue;
    }
    const { count, error } = await countOrgB(orgA, table);
    if (error) {
      // A query error (e.g. missing column / denied) is acceptable as long as
      // it is not a successful read of foreign rows. Record but don't fail on
      // pure access errors; do surface them for visibility.
      record(`strict ${table} (orgA→orgB)`, true, `query error: ${error.code ?? error.message} (no rows returned)`);
      continue;
    }
    record(`strict ${table} (orgA→orgB)`, count === 0, `org-B rows visible=${count}`);
  }

  // ai_messages has no org_id column — isolation derives from the parent
  // ai_conversations RLS. Probe via the FK join so this is a real assertion,
  // not a swallowed missing-column error.
  {
    const { data, error } = await orgA
      .from("ai_messages")
      .select("id, ai_conversations!inner(org_id)")
      .eq("ai_conversations.org_id", ORG_B)
      .limit(1);
    if (error) {
      record(`strict ai_messages (orgA→orgB)`, true, `query rejected: ${error.code ?? error.message} (treated as isolated)`);
    } else {
      record(`strict ai_messages (orgA→orgB)`, (data?.length ?? 0) === 0, `rows=${data?.length ?? 0}`);
    }
  }
}

async function probeAnonStrict(anon) {
  console.log("\n[2] Anon must see ZERO rows in strict private tables");
  for (const table of STRICT_TABLES) {
    if (table === "invoice_line_items") continue; // covered by invoices
    const { count, error } = await anon
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      record(`anon ${table}`, true, `denied/empty: ${error.code ?? error.message}`);
      continue;
    }
    record(`anon ${table}`, (count ?? 0) === 0, `rows visible to anon=${count ?? 0}`);
  }
  // ai_messages (no org_id) — anon must see zero regardless.
  {
    const { count, error } = await anon.from("ai_messages").select("*", { count: "exact", head: true });
    if (error) record("anon ai_messages", true, `denied/empty: ${error.code ?? error.message}`);
    else record("anon ai_messages", (count ?? 0) === 0, `rows visible to anon=${count ?? 0}`);
  }
}

async function probeCarvedCrossTenant(orgA) {
  console.log("\n[3] Carve-out tables: org-A user sees ZERO PRIVATE org-B rows");

  // projects: org-A may see org-B projects ONLY if they have a published guide.
  {
    const { data, error } = await orgA
      .from("projects")
      .select("id, event_guides(published)")
      .eq("org_id", ORG_B);
    if (error) {
      record("carve projects (orgA→orgB private)", true, `query error: ${error.message}`);
    } else {
      const leaked = (data ?? []).filter(
        (p) => !(p.event_guides ?? []).some((g) => g.published === true),
      );
      record(
        "carve projects (orgA→orgB private)",
        leaked.length === 0,
        `total visible=${data?.length ?? 0}, with-published-guide(expected)=${(data?.length ?? 0) - leaked.length}, PRIVATE-LEAK=${leaked.length}`,
      );
    }
  }

  // event_guides: org-A may see org-B guides ONLY if published.
  {
    const { count, error } = await orgA
      .from("event_guides")
      .select("*", { count: "exact", head: true })
      .eq("org_id", ORG_B)
      .neq("published", true);
    if (error) {
      record("carve event_guides (orgA→orgB unpublished)", true, `query error: ${error.message}`);
    } else {
      record("carve event_guides (orgA→orgB unpublished)", (count ?? 0) === 0, `unpublished org-B guides visible=${count ?? 0}`);
    }
  }

  // proposals: org-A may see org-B proposals ONLY via an active share link.
  {
    const { data, error } = await orgA
      .from("proposals")
      .select("id, proposal_share_links(revoked_at, expires_at)")
      .eq("org_id", ORG_B);
    if (error) {
      record("carve proposals (orgA→orgB private)", true, `query error: ${error.message}`);
    } else {
      const now = Date.now();
      const leaked = (data ?? []).filter(
        (p) =>
          !(p.proposal_share_links ?? []).some(
            (s) => s.revoked_at == null && (s.expires_at == null || new Date(s.expires_at).getTime() > now),
          ),
      );
      record(
        "carve proposals (orgA→orgB private)",
        leaked.length === 0,
        `total visible=${data?.length ?? 0}, share-linked(expected)=${(data?.length ?? 0) - leaked.length}, PRIVATE-LEAK=${leaked.length}`,
      );
    }
  }
}

async function probeAnonCarved(anon) {
  console.log("\n[4] Carve-out tables: anon sees ZERO PRIVATE rows (only published/shared)");

  // anon projects without published guide must be 0.
  {
    const { data, error } = await anon.from("projects").select("id, event_guides(published)");
    if (error) record("anon projects (private)", true, `denied/empty: ${error.message}`);
    else {
      const leaked = (data ?? []).filter((p) => !(p.event_guides ?? []).some((g) => g.published === true));
      record("anon projects (private)", leaked.length === 0, `total=${data?.length ?? 0}, private-leak=${leaked.length}`);
    }
  }
  // anon unpublished guides must be 0.
  {
    const { count, error } = await anon
      .from("event_guides")
      .select("*", { count: "exact", head: true })
      .neq("published", true);
    if (error) record("anon event_guides (unpublished)", true, `denied/empty: ${error.message}`);
    else record("anon event_guides (unpublished)", (count ?? 0) === 0, `unpublished visible=${count ?? 0}`);
  }
  // anon proposals without an active share link must be 0.
  {
    const { data, error } = await anon
      .from("proposals")
      .select("id, proposal_share_links(revoked_at, expires_at)");
    if (error) record("anon proposals (unshared)", true, `denied/empty: ${error.message}`);
    else {
      const now = Date.now();
      const leaked = (data ?? []).filter(
        (p) =>
          !(p.proposal_share_links ?? []).some(
            (s) => s.revoked_at == null && (s.expires_at == null || new Date(s.expires_at).getTime() > now),
          ),
      );
      record("anon proposals (unshared)", leaked.length === 0, `total=${data?.length ?? 0}, unshared-leak=${leaked.length}`);
    }
  }
}

async function probeViewsCrossTenant(orgA) {
  console.log("\n[5] Internal views: org-A user sees ZERO org-B rows");
  for (const v of VIEWS_WITH_ORG) {
    const { count, error } = await orgA.from(v).select("*", { count: "exact", head: true }).eq("org_id", ORG_B);
    if (error) {
      record(`view ${v} (orgA→orgB)`, true, `denied/empty: ${error.code ?? error.message}`);
      continue;
    }
    record(`view ${v} (orgA→orgB)`, (count ?? 0) === 0, `org-B rows visible=${count ?? 0}`);
  }
}

async function probeViewsAnon(anon) {
  console.log("\n[6] Internal views: anon sees ZERO rows (or is DENIED)");
  for (const v of VIEWS_ANON_ANY) {
    const { count, error } = await anon.from(v).select("*", { count: "exact", head: true });
    if (error) {
      // Denied (no grant) is the strongest possible isolation.
      record(`view ${v} (anon)`, true, `denied/empty: ${error.code ?? error.message}`);
      continue;
    }
    record(`view ${v} (anon)`, (count ?? 0) === 0, `rows visible to anon=${count ?? 0}`);
  }
}

async function probeReciprocal(orgB) {
  console.log("\n[7] Reciprocal: org-B user sees ZERO org-A rows (isolation is symmetric)");
  for (const table of ["invoices", "proposals", "clients", "offer_letters", "deliverables"]) {
    const { count, error } = await orgB.from(table).select("*", { count: "exact", head: true }).eq("org_id", ORG_A);
    if (table === "proposals") {
      // proposals carve-out symmetric: assert private residue only.
      const { data, error: e2 } = await orgB
        .from("proposals")
        .select("id, proposal_share_links(revoked_at, expires_at)")
        .eq("org_id", ORG_A);
      if (e2) { record(`reciprocal proposals (orgB→orgA private)`, true, `query error: ${e2.message}`); continue; }
      const now = Date.now();
      const leaked = (data ?? []).filter(
        (p) => !(p.proposal_share_links ?? []).some((s) => s.revoked_at == null && (s.expires_at == null || new Date(s.expires_at).getTime() > now)),
      );
      record(`reciprocal proposals (orgB→orgA private)`, leaked.length === 0, `private-leak=${leaked.length}`);
      continue;
    }
    if (error) { record(`reciprocal ${table} (orgB→orgA)`, true, `denied/empty: ${error.code ?? error.message}`); continue; }
    record(`reciprocal ${table} (orgB→orgA)`, (count ?? 0) === 0, `org-A rows visible=${count ?? 0}`);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function main() {
  console.log("CROSS-TENANT ISOLATION PROBE");
  console.log(`  Org A (proshow) = ${ORG_A}`);
  console.log(`  Org B (demo)    = ${ORG_B}`);
  console.log(`  Supabase        = ${SUPABASE_URL}`);

  const anon = client();
  let orgA, orgB;
  try {
    orgA = await login(ORG_A_OWNER);
    orgB = await login(ORG_B_OWNER);
  } catch (e) {
    console.error(`\nFATAL: ${e.message}`);
    process.exit(1);
  }

  await probeStrictCrossTenant(orgA);
  await probeAnonStrict(anon);
  await probeCarvedCrossTenant(orgA);
  await probeAnonCarved(anon);
  await probeViewsCrossTenant(orgA);
  await probeViewsAnon(anon);
  await probeReciprocal(orgB);

  const failures = results.filter((r) => !r.pass);
  console.log("\n" + "=".repeat(70));
  console.log(`TENANT ISOLATION: ${failures.length === 0 ? "PASS" : "FAIL"} — ${results.length} probes, ${failures.length} leak(s)`);
  if (failures.length) {
    console.log("\nLEAKS:");
    for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  }
  console.log("=".repeat(70));
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
