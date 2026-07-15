#!/usr/bin/env node
/**
 * Seed the Playwright E2E fixture users.
 *
 * The suite logs in via `loginAs(page, role)` → `test+<role>@flyingbluewhale.app`
 * / `FlyingBlue!Test2026` (see e2e/helpers/auth.ts). This script provisions every
 * fixture user + membership idempotently, so a fresh test DB can run the suite.
 *
 * Requires the service-role key (NOT in .env.local). Provide it via the env or
 * pull it from the Supabase CLI:
 *   SUPABASE_SERVICE_ROLE_KEY=$(supabase projects api-keys --project-ref <ref> \
 *     --output json | jq -r '.[]|select(.name=="service_role").api_key') \
 *     node scripts/seed-e2e-fixtures.mjs
 *
 * It (a) creates each fixture user email-confirmed via the GoTrue admin API and
 * (b) adds memberships in the four canonical Test orgs with the matching platform
 * role + persona (mirrors the existing seeded fixtures: e.g. crew has
 * role=member, persona=crew). Persona drives the granular capability map in
 * src/lib/auth.ts#CAPABILITIES_BY_PERSONA.
 *
 * Robustness notes: this project's GoTrue `admin.listUsers()` currently 500s
 * ("Database error finding users"), so existence is probed by attempting
 * createUser and, on an "already registered" error, signing in with the anon key
 * to recover the user id — never via listUsers.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const envtxt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => process.env[k] || envtxt.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const ANON = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE = get("SUPABASE_SERVICE_ROLE_KEY");
if (!SERVICE) {
  console.error("✗ SUPABASE_SERVICE_ROLE_KEY required. Pull it from the Supabase CLI (see header) and re-run.");
  process.exit(1);
}
const admin = createClient(SUPABASE_URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = "FlyingBlue!Test2026";

// The four canonical Test orgs (every fixture user is a member of all four).
const TEST_ORGS = [
  "39c5b82a-29fa-47ff-a43c-fe9c116cd27e", // Portal
  "0443cdf4-384c-44ea-8de7-25e5de77d2c8", // Starter
  "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7", // Professional
  "e901f2c4-0c3c-496d-8d30-16e98f2eb809", // Enterprise
];

// role suffix → { platformRole (memberships.role enum), persona (text) }.
// Convention from the existing fixtures: persona === the suffix; crew/client/etc.
// all carry platformRole=member but a granular persona.
const ROLES = {
  owner: { role: "owner", persona: "owner" },
  admin: { role: "admin", persona: "admin" },
  manager: { role: "manager", persona: "manager" },
  member: { role: "member", persona: "member" },
  viewer: { role: "member", persona: "viewer" },
  crew: { role: "member", persona: "crew" },
  client: { role: "member", persona: "client" },
  contractor: { role: "member", persona: "contractor" },
  community: { role: "member", persona: "community" },
  collaborator: { role: "member", persona: "collaborator" },
  controller: { role: "admin", persona: "controller" },
  developer: { role: "admin", persona: "developer" },
  vendor: { role: "member", persona: "vendor" },
  guest: { role: "member", persona: "guest" },
};

// The Professional test org + its stable fixture project (mirrors
// e2e/helpers/fixtures.ts). Project-role + PAT fixtures hang off these.
const PROFESSIONAL_ORG = "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7";
const FIXTURE_PROJECT_SLUG = "test-professional-show";

// Project-role assignments on the fixture project, keyed by role suffix. All
// are platform `member`, so hasProjectRole's project_members branch (not the
// manager+ bypass) is what these exercise — the axis that makes project-role
// authz testable end-to-end. See src/lib/auth.ts#hasProjectRole.
const PROJECT_ROLE_FIXTURES = {
  member: "lead",
  crew: "contributor",
  contractor: "viewer",
  vendor: "vendor",
};

// Scoped PAT fixtures (Professional org, created_by=owner). scopes[] gate
// independently of role, exercising grant + denial at the /api/v1 boundary.
// Token format sk_<8hex>_<secret>; hashed_secret = sha256(token). Mirrors
// e2e/helpers/fixtures.ts#PAT_FIXTURES + src/lib/api-keys.ts.
const PAT_FIXTURES = [
  { name: "E2E documents:read", token: "sk_e2edoc0r_documentsreadtokensecret0001", scopes: ["documents:read"] },
  { name: "E2E documents:write", token: "sk_e2edoc0w_documentswritetokensecret001", scopes: ["documents:read", "documents:write"] },
  { name: "E2E reports:read", token: "sk_e2erpt0r_reportsreadtokensecret000001", scopes: ["reports:read"] },
];

// A proposal on the fixture project carrying a PENDING approval — the surface
// for the proposals:approve sign-off boundary (see e2e/portal-proposal-approve
// .spec.ts). Fixed ids so the spec + this seeder agree; reset to pending on
// re-run so the fixture survives an accidental sign.
const PROPOSAL_FIXTURE_ID = "c2000000-0000-4000-8000-000000000001";
const APPROVAL_FIXTURE_ID = "c2000000-0000-4000-8000-000000000002";

// A party-bound advancing assignment: an `issued` credential whose party is
// test+crew, on the fixture project. Lets the C3 spec assert the party sees
// THEIR assignment across the COMPVSS + GVTEWAY shells. Fixed ids.
const CATALOG_ITEM_FIXTURE_ID = "c3000000-0000-4000-8000-000000000001";
const ASSIGNMENT_FIXTURE_ID = "c3000000-0000-4000-8000-000000000002";

// Subcontractor eligibility-gated dispatch fixture: a posted work order on a
// unique trade (requires a COI) with a BLOCKED sub (W9 only) + an ELIGIBLE sub
// (current COI). Drives v_sub_eligibility → the H5 award gate.
const WO_BLOCKED_VENDOR_ID = "c5000000-0000-4000-8000-000000000001";
const WO_ELIGIBLE_VENDOR_ID = "c5000000-0000-4000-8000-000000000002";
const WO_FIXTURE_ID = "c5000000-0000-4000-8000-000000000010";
const WO_TRADE = "e2e-trade";

// A `sent` public offer letter with a known token + code, cloned from a real
// frozen snapshot so LetterDocument renders complete. Drives the H7 unlock gate.
const OFFER_LETTER_FIXTURE_ID = "c6000000-0000-4000-8000-000000000001";
const OFFER_LETTER_TOKEN = "c6000000-0000-4000-8000-0000000000ff";
const OFFER_LETTER_CODE = "E2CODE"; // exactly 6 chars — unlock input is maxLength=6

// A published marketplace gig (public job board) for the applicant-submit spec.
const JOB_POSTING_FIXTURE_ID = "c7000000-0000-4000-8000-000000000001";
const JOB_POSTING_SLUG = "e2e-gig";

// Active approval policies so the "Route To Approvals" record action can open an
// approval_instances row for a PO / PO change order. `routeToApprovals`
// (src/lib/approvals/route.ts) bails with "No approval policy covers <table>"
// unless an active approval_policies row matches applies_to = the subject table.
// approval_policies insert is is_org_admin-only, so a manager can't self-seed it
// in-test — these live here (service role). Durable fixtures (NOT E2E-stamped, so
// the "E2E Policy%" teardown pattern leaves them in place).
const APPROVAL_POLICY_PO_ID = "c8000000-0000-4000-8000-000000000001";
const APPROVAL_POLICY_PO_CO_ID = "c8000000-0000-4000-8000-000000000002";

// Recover an existing user's id without listUsers() (which 500s here): sign in
// with the canonical fixture password via the anon endpoint.
async function userIdViaSignIn(email) {
  if (!ANON) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.user?.id ?? null;
}

async function ensureUser(role) {
  const email = `test+${role}@flyingbluewhale.app`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: `E2E ${role}` },
  });
  if (!error) {
    console.log(`  + created ${email}`);
    return data.user.id;
  }
  if (/already|exists|registered/i.test(error.message) || error.code === "email_exists") {
    const id = await userIdViaSignIn(email);
    console.log(`  · exists ${email}${id ? "" : " (id unresolved — membership skipped)"}`);
    return id;
  }
  throw new Error(`createUser ${email}: ${error.message}`);
}

async function ensureMemberships(userId, role) {
  const { role: platformRole, persona } = ROLES[role];
  for (const orgId of TEST_ORGS) {
    const { data: existing } = await admin
      .from("memberships")
      .select("id")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (existing) continue;
    const { error } = await admin
      .from("memberships")
      .insert({ user_id: userId, org_id: orgId, role: platformRole, persona });
    if (error) throw new Error(`membership ${role}@${orgId}: ${error.message}`);
  }
  console.log(`    ✓ memberships (${platformRole}/${persona}) across ${TEST_ORGS.length} test orgs`);
}

// Seed project-role rows on the fixture project for the given {suffix→role}
// map. Idempotent via the (project_id,user_id) unique key.
async function ensureProjectRoles(userIds) {
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("org_id", PROFESSIONAL_ORG)
    .eq("slug", FIXTURE_PROJECT_SLUG)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) {
    console.warn(`    ! project-roles skipped — no project ${FIXTURE_PROJECT_SLUG} in Professional org`);
    return;
  }
  for (const [suffix, role] of Object.entries(PROJECT_ROLE_FIXTURES)) {
    const userId = userIds[suffix];
    if (!userId) continue;
    const { error } = await admin
      .from("project_members")
      .upsert({ project_id: project.id, user_id: userId, role }, { onConflict: "project_id,user_id" });
    if (error) console.warn(`    ! project-role ${suffix}=${role}: ${error.message}`);
  }
  console.log(`    ✓ project roles on ${FIXTURE_PROJECT_SLUG}: ${Object.entries(PROJECT_ROLE_FIXTURES).map(([s, r]) => `${s}→${r}`).join(", ")}`);
}

// Seed the scoped PATs (created_by=owner). No unique constraint on prefix, so
// delete-then-insert for idempotency.
async function ensurePats(ownerId) {
  if (!ownerId) {
    console.warn("    ! PATs skipped — owner id unresolved");
    return;
  }
  for (const pat of PAT_FIXTURES) {
    const prefix = pat.token.slice(0, pat.token.indexOf("_", 3)); // sk_<8hex>
    const hashedSecret = createHash("sha256").update(pat.token).digest("hex");
    await admin.from("api_keys").delete().eq("prefix", prefix);
    const { error } = await admin.from("api_keys").insert({
      org_id: PROFESSIONAL_ORG,
      name: pat.name,
      prefix,
      hashed_secret: hashedSecret,
      scopes: pat.scopes,
      created_by: ownerId,
    });
    if (error) console.warn(`    ! PAT ${pat.name}: ${error.message}`);
  }
  console.log(`    ✓ PAT fixtures: ${PAT_FIXTURES.map((p) => p.name).join(", ")}`);
}

// Seed (or reset to pending) the proposal + approval sign-off fixture on the
// Professional-org fixture project. Idempotent via the primary-key upserts.
async function ensureProposalApproval() {
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("org_id", PROFESSIONAL_ORG)
    .eq("slug", FIXTURE_PROJECT_SLUG)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) {
    console.warn("    ! proposal-approval skipped — fixture project missing");
    return;
  }
  const { error: pErr } = await admin.from("proposals").upsert(
    {
      id: PROPOSAL_FIXTURE_ID,
      org_id: PROFESSIONAL_ORG,
      project_id: project.id,
      title: "E2E Proposal — Client Sign-off Fixture",
      proposal_state: "sent",
      deleted_at: null,
    },
    { onConflict: "id" },
  );
  if (pErr) {
    console.warn(`    ! proposal fixture: ${pErr.message}`);
    return;
  }
  const { error: aErr } = await admin.from("proposal_approvals").upsert(
    {
      id: APPROVAL_FIXTURE_ID,
      proposal_id: PROPOSAL_FIXTURE_ID,
      org_id: PROFESSIONAL_ORG,
      kind: "signature",
      title: "E2E Countersignature",
      body: "Sign to accept the proposal terms (e2e fixture — kept pending).",
      state: "pending",
      signed_at: null,
      signed_by: null,
      signed_label: null,
      decline_reason: null,
    },
    { onConflict: "id" },
  );
  if (aErr) console.warn(`    ! approval fixture: ${aErr.message}`);
  else console.log("    ✓ proposal + pending approval fixture (proposals:approve boundary)");
}

// Seed the active approval policies the "Route To Approvals" record action needs
// (PO + PO change order). Without an active approval_policies row matching the
// subject table, routeToApprovals returns "No approval policy covers …" and the
// action never redirects. Idempotent via primary-key upserts.
async function ensureApprovalPolicies() {
  const rows = [
    {
      id: APPROVAL_POLICY_PO_ID,
      org_id: PROFESSIONAL_ORG,
      slug: "po-route-fixture",
      name: "Purchase Order Approvals (e2e fixture)",
      description: "Routes purchase orders into the approvals engine. Seeded for e2e route-to-approvals coverage.",
      applies_to: "purchase_orders",
      version: 1,
      active: true,
    },
    {
      id: APPROVAL_POLICY_PO_CO_ID,
      org_id: PROFESSIONAL_ORG,
      slug: "po-co-route-fixture",
      name: "PO Change Order Approvals (e2e fixture)",
      description: "Routes PO change orders into the approvals engine. Seeded for e2e route-to-approvals coverage.",
      applies_to: "po_change_orders",
      version: 1,
      active: true,
    },
  ];
  const { error } = await admin.from("approval_policies").upsert(rows, { onConflict: "id" });
  if (error) console.warn(`    ! approval policy fixtures: ${error.message}`);
  else console.log("    ✓ approval policy fixtures (purchase_orders + po_change_orders route-to-approvals)");
}

// Seed a party-bound advancing assignment (crew, issued credential) on the
// fixture project. Idempotent via primary-key upserts.
async function ensureAdvancingAssignment(userIds) {
  const crewId = userIds.crew;
  if (!crewId) {
    console.warn("    ! advancing skipped — crew id unresolved");
    return;
  }
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("org_id", PROFESSIONAL_ORG)
    .eq("slug", FIXTURE_PROJECT_SLUG)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) {
    console.warn("    ! advancing skipped — fixture project missing");
    return;
  }
  const { error: cErr } = await admin.from("master_catalog_items").upsert(
    { id: CATALOG_ITEM_FIXTURE_ID, org_id: PROFESSIONAL_ORG, kind: "credential", code: "E2E-CRED", name: "E2E Crew Credential", active: true },
    { onConflict: "id" },
  );
  if (cErr) {
    console.warn(`    ! catalog fixture: ${cErr.message}`);
    return;
  }
  const { error: aErr } = await admin.from("assignments").upsert(
    {
      id: ASSIGNMENT_FIXTURE_ID,
      org_id: PROFESSIONAL_ORG,
      project_id: project.id,
      catalog_item_id: CATALOG_ITEM_FIXTURE_ID,
      catalog_kind: "credential",
      party_kind: "user",
      party_user_id: crewId,
      fulfillment_state: "issued",
      title: "E2E Crew Credential",
    },
    { onConflict: "id" },
  );
  if (aErr) console.warn(`    ! assignment fixture: ${aErr.message}`);
  else console.log("    ✓ advancing assignment fixture (crew, issued credential)");
}

// Seed the eligibility-gated dispatch fixture. Idempotent via upserts + a
// doc reset so the derived v_sub_eligibility verdicts stay deterministic.
async function ensureDispatchGate() {
  const { error: vErr } = await admin.from("vendors").upsert(
    [
      { id: WO_BLOCKED_VENDOR_ID, org_id: PROFESSIONAL_ORG, name: "E2E Blocked Sub" },
      { id: WO_ELIGIBLE_VENDOR_ID, org_id: PROFESSIONAL_ORG, name: "E2E Eligible Sub" },
    ],
    { onConflict: "id" },
  );
  if (vErr) {
    console.warn(`    ! dispatch vendors: ${vErr.message}`);
    return;
  }
  await admin
    .from("trade_requirements")
    .upsert({ org_id: PROFESSIONAL_ORG, trade: WO_TRADE, doc_kind: "coi" }, { onConflict: "org_id,trade,doc_kind" });
  await admin.from("compliance_documents").delete().in("vendor_id", [WO_BLOCKED_VENDOR_ID, WO_ELIGIBLE_VENDOR_ID]);
  await admin.from("compliance_documents").insert([
    { org_id: PROFESSIONAL_ORG, vendor_id: WO_BLOCKED_VENDOR_ID, doc_kind: "w9", expires_on: null },
    { org_id: PROFESSIONAL_ORG, vendor_id: WO_ELIGIBLE_VENDOR_ID, doc_kind: "coi", expires_on: "2030-01-01" },
  ]);
  await admin.from("work_orders").upsert(
    {
      id: WO_FIXTURE_ID,
      org_id: PROFESSIONAL_ORG,
      title: "E2E Dispatch Gate",
      trade: WO_TRADE,
      work_order_state: "posted",
      visibility: "private",
      awarded_vendor_id: null,
    },
    { onConflict: "id" },
  );
  await admin.from("work_order_bids").upsert(
    [
      { org_id: PROFESSIONAL_ORG, work_order_id: WO_FIXTURE_ID, vendor_id: WO_BLOCKED_VENDOR_ID, amount_cents: 100000 },
      { org_id: PROFESSIONAL_ORG, work_order_id: WO_FIXTURE_ID, vendor_id: WO_ELIGIBLE_VENDOR_ID, amount_cents: 110000 },
    ],
    { onConflict: "work_order_id,vendor_id" },
  );
  console.log("    ✓ dispatch eligibility-gate fixture (blocked + eligible subs)");
}

// Best-effort: clone a real frozen offer-letter snapshot into a `sent` fixture
// with a known token + code. Skips if no source snapshot exists on a fresh DB.
async function ensureOfferLetter() {
  const { data: src } = await admin
    .from("offer_letters")
    .select("crew_member_id, role_id, employer, classification, snapshot")
    .not("snapshot", "is", null)
    .limit(1)
    .maybeSingle();
  if (!src) {
    console.warn("    ! offer letter skipped — no source snapshot to clone");
    return;
  }
  const { data: project } = await admin
    .from("projects")
    .select("id")
    .eq("org_id", PROFESSIONAL_ORG)
    .eq("slug", FIXTURE_PROJECT_SLUG)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) {
    console.warn("    ! offer letter skipped — fixture project missing");
    return;
  }
  const { error } = await admin.from("offer_letters").upsert(
    {
      id: OFFER_LETTER_FIXTURE_ID,
      org_id: PROFESSIONAL_ORG,
      project_id: project.id,
      crew_member_id: src.crew_member_id,
      role_id: src.role_id,
      employer: src.employer,
      classification: src.classification,
      public_token: OFFER_LETTER_TOKEN,
      access_code: OFFER_LETTER_CODE,
      letter_state: "sent",
      snapshot: src.snapshot,
      snapshot_at: new Date().toISOString(),
      token_expires_at: null,
      accepted_at: null,
      declined_at: null,
      withdrawn_at: null,
    },
    { onConflict: "id" },
  );
  if (error) console.warn(`    ! offer letter fixture: ${error.message}`);
  else console.log("    ✓ offer-letter unlock fixture (sent, token + code)");
}

// A published gig on the public job board for the marketplace applicant-submit
// spec. Idempotent via the primary-key upsert.
async function ensureJobPosting() {
  const { error } = await admin.from("job_postings").upsert(
    {
      id: JOB_POSTING_FIXTURE_ID,
      org_id: PROFESSIONAL_ORG,
      title: "E2E Gig · Stagehand",
      public_slug: JOB_POSTING_SLUG,
      job_posting_phase: "published",
    },
    { onConflict: "id" },
  );
  if (error) console.warn(`    ! job posting fixture: ${error.message}`);
  else console.log("    ✓ published gig fixture (marketplace apply)");
}

console.log("Seeding E2E fixture users…");
const userIds = {};
for (const role of Object.keys(ROLES)) {
  const id = await ensureUser(role);
  if (id) {
    userIds[role] = id;
    await ensureMemberships(id, role).catch((e) => console.warn(`    ! ${role}: ${e.message}`));
  }
}
console.log("Seeding project-role + PAT + proposal-approval fixtures…");
await ensureProjectRoles(userIds);
await ensurePats(userIds.owner);
await ensureProposalApproval();
await ensureApprovalPolicies();
await ensureAdvancingAssignment(userIds);
await ensureDispatchGate();
await ensureOfferLetter();
await ensureJobPosting();
console.log("✓ Done. Fixture users provisioned for:", Object.keys(ROLES).join(", "));
