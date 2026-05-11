/**
 * E2E-LRP Phase 7 — Teardown
 * ==========================
 *
 * Removes every record produced by the seed run. Idempotent — running on a
 * cleanly torn-down DB is a no-op. Refuses to run against the production
 * Supabase project.
 *
 * Strategy: cascade from `orgs` → ON DELETE CASCADE handles the tree of
 * project, project_members, equipment, asset_movements, financial_periods,
 * subscriptions, transitions tables, etc. Auth users are deleted explicitly
 * since they live in the `auth` schema.
 */

import { createClient } from "@supabase/supabase-js";

const SEED_RUN_ID = "E2E_LRP_2026_05_09";
const SEED_PREFIX = `${SEED_RUN_ID}__`;
const PROD_PROJECT_REF = "xrovijzjbyssajhtwvas";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL required");
  if (url.includes(PROD_PROJECT_REF)) {
    throw new Error(`Refusing to teardown against production project ${PROD_PROJECT_REF}.`);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1. Find seeded orgs by metadata tag.
  const orgs = await supabase.from("orgs").select("id, slug").contains("metadata", { seed_run_id: SEED_RUN_ID });
  if (orgs.error) throw orgs.error;

  const orgIds = (orgs.data ?? []).map((o: { id: string }) => o.id);
  if (!orgIds.length) {
    console.info(`No seeded orgs found for run ${SEED_RUN_ID}. Nothing to teardown.`);
    return;
  }

  // 2. Find auth users by email pattern (the namespaced parties).
  const { data: usersList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const seedUserIds = (usersList?.users ?? [])
    .filter((u) => u.email?.startsWith(SEED_PREFIX.toLowerCase()))
    .map((u) => u.id);

  // 3. Delete orgs — CASCADE removes project, project_members, equipment,
  //    asset_movements, financial_periods, subscriptions, all *_transitions.
  for (const orgId of orgIds) {
    const del = await supabase.from("orgs").delete().eq("id", orgId);
    if (del.error) throw del.error;
  }

  // 4. Delete auth users.
  for (const userId of seedUserIds) {
    await supabase.auth.admin.deleteUser(userId);
  }

  console.info(`Teardown complete. Removed ${orgIds.length} org(s) and ${seedUserIds.length} user(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
