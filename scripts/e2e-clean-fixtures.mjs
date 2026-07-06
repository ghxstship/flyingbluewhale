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
];

async function main() {
  if (!SUPABASE_URL || !ANON) {
    console.error("e2e:clean — missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY; skipping.");
    return;
  }
  const supabase = createClient(SUPABASE_URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (authErr) {
    console.error(`e2e:clean — owner sign-in failed (${authErr.message}); skipping cleanup.`);
    return;
  }

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
  await supabase.auth.signOut();
}

main().catch((e) => {
  // Best-effort: never fail the run on cleanup trouble.
  console.error(`e2e:clean — unexpected error (ignored): ${e?.message ?? e}`);
});
