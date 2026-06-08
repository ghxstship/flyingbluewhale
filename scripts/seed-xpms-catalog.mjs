#!/usr/bin/env node
/**
 * Seed the ATLVS Master XPMS Catalog into master_catalog_items (canonical).
 * Reads scripts/.xpms-catalog.json (produced by build-xpms-master-catalog.py).
 * Auth: demo admin via anon key (RLS: is_org_member). Idempotent upsert on (org_id, code).
 * Requires migration 20260608120000 applied first (adds 'labor' kind + XPMS columns).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const ORG = "68672cc3-0667-4234-ad77-49325e173175";
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: ae } = await sb.auth.signInWithPassword({ email: "admin@gvteway.test", password: "CompvssTest2026!" });
if (ae) { console.error("sign-in:", ae.message); process.exit(2); }

const { records, fbw } = JSON.parse(readFileSync(resolve(ROOT, "scripts/.xpms-catalog.json"), "utf8"));

const rows = records.map((r) => ({
  org_id: ORG, kind: r.kind, code: r.code, name: r.name, description: r.description,
  unit_cost_cents: r.unit_cost_cents, currency: "USD", active: true, scope: "canonical",
  deleted_at: null, urid: r.urid, xpms_department: r.department, discipline: r.discipline,
  default_tier: r.tier, default_phase: r.phase, xyz: r.xyz,
}));

let up = 0;
for (let i = 0; i < rows.length; i += 100) {
  const batch = rows.slice(i, i + 100);
  const { error } = await sb.from("master_catalog_items").upsert(batch, { onConflict: "org_id,code" });
  if (error) { console.error(`batch ${i}: ${error.message}`); process.exit(1); }
  up += batch.length;
}
console.log(`upserted ${up} FrozenPhoenix items`);

let updated = 0;
for (const u of fbw) {
  const { error, count } = await sb.from("master_catalog_items")
    .update({ urid: u.urid, xpms_department: u.department, discipline: u.discipline,
              default_tier: u.tier, default_phase: u.phase, xyz: u.xyz }, { count: "exact" })
    .eq("org_id", ORG).eq("code", u.code).is("deleted_at", null);
  if (error) { console.error(`fbw ${u.code}: ${error.message}`); process.exit(1); }
  updated += count ?? 0;
}
console.log(`classified ${updated}/${fbw.length} existing flyingbluewhale items`);
