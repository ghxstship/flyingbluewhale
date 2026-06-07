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
};

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

console.log("Seeding E2E fixture users…");
for (const role of Object.keys(ROLES)) {
  const id = await ensureUser(role);
  if (id) await ensureMemberships(id, role).catch((e) => console.warn(`    ! ${role}: ${e.message}`));
}
console.log("✓ Done. Fixture users provisioned for:", Object.keys(ROLES).join(", "));
