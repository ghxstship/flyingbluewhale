#!/usr/bin/env node
/**
 * Seed the Playwright E2E fixture users.
 *
 * The suite logs in via `loginAs(page, role)` → `test+<role>@flyingbluewhale.app`
 * / `FlyingBlue!Test2026` (see e2e/helpers/auth.ts). Only `owner` and `admin`
 * currently exist in the live DB, so ~21 role/RLS/handoff/marketplace specs fail
 * at the login step. This script provisions the rest, idempotently.
 *
 * Requires the service-role key (NOT in .env.local — set it in CI or locally):
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-e2e-fixtures.mjs
 *
 * It (a) creates each fixture user email-confirmed via the GoTrue admin API and
 * (b) adds a platform membership in the canonical test org with the matching
 * role. Portal-persona-only roles (client/contractor) are created as users +
 * given a member membership so they can authenticate; spec families that need a
 * specific portal `uis_roles` engagement or seeded records (booking deals,
 * marketplace items, the `test-professional-show` project) layer that on top.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => process.env[k] || env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const URL = get("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE = get("SUPABASE_SERVICE_ROLE_KEY");
if (!SERVICE) {
  console.error("✗ SUPABASE_SERVICE_ROLE_KEY required (not in .env.local). Set it in the environment and re-run.");
  process.exit(1);
}
const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = "FlyingBlue!Test2026";
// Canonical test org (Test Portal Org — where owner/admin already live).
const TEST_ORG = "39c5b82a-29fa-47ff-a43c-fe9c116cd27e";

// role suffix → platform membership role. client/contractor authenticate as
// members; their portal persona is assigned separately by persona-specific seeds.
const ROLES = {
  owner: "owner",
  admin: "admin",
  manager: "manager",
  member: "member",
  viewer: "viewer",
  crew: "member",
  client: "member",
  contractor: "member",
  community: "member",
};

async function findUserByEmail(email) {
  // paginate listUsers (no getByEmail in supabase-js admin)
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(role) {
  const email = `test+${role}@flyingbluewhale.app`;
  let user = await findUserByEmail(email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `E2E ${role}` },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    user = data.user;
    console.log(`  + created ${email}`);
  } else {
    // ensure confirmed + password reset to the canonical fixture password
    await admin.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
    console.log(`  · ensured ${email}`);
  }
  return user;
}

async function ensureMembership(userId, role) {
  const memRole = ROLES[role];
  const { data: existing } = await admin
    .from("memberships")
    .select("id, role")
    .eq("user_id", userId)
    .eq("org_id", TEST_ORG)
    .maybeSingle();
  if (existing) {
    if (existing.role !== memRole) {
      await admin.from("memberships").update({ role: memRole }).eq("id", existing.id);
      console.log(`    ↻ membership role → ${memRole}`);
    }
    return;
  }
  const { error } = await admin.from("memberships").insert({ user_id: userId, org_id: TEST_ORG, role: memRole });
  if (error) throw new Error(`membership ${role}: ${error.message}`);
  console.log(`    + membership ${memRole} @ ${TEST_ORG}`);
}

console.log("Seeding E2E fixture users…");
for (const role of Object.keys(ROLES)) {
  const u = await ensureUser(role);
  await ensureMembership(u.id, role).catch((e) => console.warn(`    ! ${role} membership: ${e.message}`));
}
console.log("✓ Done. Fixture users provisioned for:", Object.keys(ROLES).join(", "));
