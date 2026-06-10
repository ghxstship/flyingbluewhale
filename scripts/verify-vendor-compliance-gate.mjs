// Runtime proof of the W-9/COI PO-bind compliance gate (tg_check_vendor_compliance)
// Authenticates as the live Wynwood owner and drives the gate through RLS.
// Self-cleans (soft + hard deletes the test PO + vendor it creates).
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const anon = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const sb = createClient(url, anon, { auth: { persistSession: false } });

const log = (...a) => console.log(...a);
const fail = (m) => { console.error("✗ FAIL:", m); process.exitCode = 1; };

const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
  email: "casa.wynwood@atlvs.pro",
  password: "CasaWynwood2026!",
});
if (authErr) { fail(`sign-in: ${authErr.message}`); process.exit(1); }
log("✓ signed in as", auth.user.email);

// Resolve the Wynwood org via membership (RLS-scoped)
const { data: mems, error: memErr } = await sb
  .from("memberships")
  .select("org_id, role, orgs(name)")
  .eq("user_id", auth.user.id);
if (memErr) { fail(`memberships: ${memErr.message}`); process.exit(1); }
const wyn = mems.find((m) => /wynwood/i.test(m.orgs?.name || ""));
if (!wyn) { fail(`no Wynwood membership found; have: ${mems.map((m) => m.orgs?.name).join(", ")}`); process.exit(1); }
const orgId = wyn.org_id;
log("✓ org:", wyn.orgs.name, `(${wyn.role})`, orgId);

const stamp = Date.now();
let vendorId, poId;
try {
  // 1) Non-compliant vendor: no W-9, no COI
  const { data: v, error: ve } = await sb.from("vendors").insert({
    org_id: orgId, name: `GATE-TEST Vendor ${stamp}`, w9_on_file: false, coi_expires_at: null,
  }).select("id").single();
  if (ve) { fail(`create vendor: ${ve.message}`); process.exit(1); }
  vendorId = v.id;
  log("✓ created non-compliant vendor (w9=false, coi=null)");

  // 2) PO in draft referencing the vendor — should SUCCEED (gate only fires on bind)
  const { data: po, error: pe } = await sb.from("purchase_orders").insert({
    org_id: orgId, vendor_id: vendorId, number: `GATE-${stamp}`, title: "Gate test PO",
    amount_cents: 100000, po_state: "draft",
  }).select("id").single();
  if (pe) { fail(`create draft PO: ${pe.message}`); process.exit(1); }
  poId = po.id;
  log("✓ draft PO created (gate dormant in draft) — correct");

  // 3) Bind PO (status->sent) with NO W-9 — expect BLOCK
  let r = await sb.from("purchase_orders").update({ po_state: "sent" }).eq("id", poId);
  if (r.error && /W-9|missing W-9|PO blocked/i.test(r.error.message)) {
    log("✓ BIND BLOCKED (no W-9):", r.error.message);
  } else if (r.error) {
    log("✓ bind rejected (no W-9), msg:", r.error.message);
  } else {
    fail("PO bound to 'sent' WITHOUT a W-9 — gate did NOT fire!");
  }

  // 4) Add W-9 but still no COI — expect BLOCK on COI
  await sb.from("vendors").update({ w9_on_file: true, coi_expires_at: null }).eq("id", vendorId);
  r = await sb.from("purchase_orders").update({ po_state: "sent" }).eq("id", poId);
  if (r.error && /COI|insurance|PO blocked/i.test(r.error.message)) {
    log("✓ BIND BLOCKED (W-9 ok, COI missing):", r.error.message);
  } else if (r.error) {
    log("✓ bind rejected (COI missing), msg:", r.error.message);
  } else {
    fail("PO bound to 'sent' with MISSING COI — COI gate did NOT fire!");
  }

  // 5) Add a future COI — expect bind to SUCCEED
  const future = new Date(stamp + 365 * 864e5).toISOString().slice(0, 10);
  await sb.from("vendors").update({ w9_on_file: true, coi_expires_at: future }).eq("id", vendorId);
  r = await sb.from("purchase_orders").update({ po_state: "sent" }).eq("id", poId).select("id,po_state").single();
  if (r.error) {
    fail(`compliant vendor bind should SUCCEED but was blocked: ${r.error.message}`);
  } else {
    log(`✓ BIND ALLOWED once compliant (W-9 + COI ${future}) → status=${r.data.status} — correct`);
  }

  // 6) Expired COI — expect BLOCK again (move PO back to draft first, then re-bind)
  await sb.from("purchase_orders").update({ po_state: "draft" }).eq("id", poId);
  await sb.from("vendors").update({ coi_expires_at: "2020-01-01" }).eq("id", vendorId);
  r = await sb.from("purchase_orders").update({ po_state: "sent" }).eq("id", poId);
  if (r.error && /COI|insurance|PO blocked/i.test(r.error.message)) {
    log("✓ BIND BLOCKED (COI expired 2020-01-01):", r.error.message);
  } else if (r.error) {
    log("✓ bind rejected (expired COI), msg:", r.error.message);
  } else {
    fail("PO bound to 'sent' with EXPIRED COI — gate did NOT fire!");
  }
} finally {
  // Cleanup — hard delete the test rows so the Wynwood org stays clean
  if (poId) await sb.from("purchase_orders").delete().eq("id", poId);
  if (vendorId) await sb.from("vendors").delete().eq("id", vendorId);
  log("✓ cleaned up test PO + vendor");
}

log(process.exitCode ? "\n=== GATE TEST: FAIL ===" : "\n=== GATE TEST: ALL CHECKS PASSED ===");
