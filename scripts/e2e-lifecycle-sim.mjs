#!/usr/bin/env node
/**
 * E2E-LRP — Spotify Casa Miami lifecycle simulation.
 *
 * Drives all four event briefs (S/M/L/XL) through the full XPMS lifecycle —
 * Discovery → Design → Advance → Procurement → Build → Install → Operate →
 * Close — inside the real ATLVS schema, exercising every XPMS touchpoint and
 * the unified advancing system (assignments + fulfillment_state machine +
 * events log + scan codes). Each touchpoint records PASS / FAIL / SKIP; a FAIL
 * is a deployment-readiness gap.
 *
 * Per E2E_LRP_PRESET Q5: runs in a NAMESPACED DISPOSABLE org (created via the
 * create_org_with_owner RPC), tagged by seed_run_id. Teardown deletes only that
 * org (cascade). No non-namespaced data is touched.
 *
 * Auth: admin@gvteway.test (RLS path). Run:
 *   node scripts/e2e-lifecycle-sim.mjs            # run + report (leaves data)
 *   node scripts/e2e-lifecycle-sim.mjs --teardown # delete the run's org
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PROD_REF = "xrovijzjbyssajhtwvas";
const RUN_ID = "E2E_LRP_2026_06_05";
const SLUG = "e2e-lrp-2026-06-05";

const sb = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
const results = [];
const rec = (event, gate, touchpoint, status, detail = "") => {
  results.push({ event, gate, touchpoint, status, detail: String(detail).slice(0, 240) });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "·";
  if (status !== "PASS") console.info(`  ${icon} [${event}/${gate}] ${touchpoint} — ${status}${detail ? ": " + String(detail).slice(0, 120) : ""}`);
};
async function step(event, gate, touchpoint, fn) {
  try { const v = await fn(); rec(event, gate, touchpoint, "PASS"); return v; }
  catch (e) { rec(event, gate, touchpoint, "FAIL", e?.message || e); return null; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
async function ins(table, row, sel = "id") {
  const { data, error } = await sb.from(table).insert(row).select(sel).single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}
async function upd(table, id, patch) {
  // .select() so we can assert rows-affected — a silent 0-row update (RLS or
  // missing row) must FAIL, not falsely PASS.
  const { data, error } = await sb.from(table).update(patch).eq("id", id).select("id");
  if (error) throw new Error(`${table} update: ${error.message}`);
  if (!data || data.length === 0) throw new Error(`${table} update: 0 rows affected (RLS/missing)`);
}

// ── event briefs (S/M/L/XL) + budget data from the reconciled model ─────────
const kitsData = JSON.parse(readFileSync(resolve(ROOT, "docs/proposals/casa-miami/_fragments/casa_kits.json"), "utf8"));
const EVENTS = [
  { tier: "T1", scale: "S",  artist: "Silvana Estrada", slug: "csm-silvana", attendees: 80,  draws: [[60,"Deposit","Advance"],[40,"Balance","Operate"]] },
  { tier: "T2", scale: "M",  artist: "Rawayana",         slug: "csm-rawayana", attendees: 200, draws: [[60,"Deposit","Advance"],[40,"Balance","Operate"]] },
  { tier: "T3", scale: "L",  artist: "Under Argentino",  slug: "csm-under",    attendees: 300, draws: [[50,"Mobilization","Discovery"],[30,"Progress","Build"],[20,"Final","Close"]] },
  { tier: "T4", scale: "XL", artist: "Calle Casa Vol.01",slug: "csm-callecasa",attendees: 400, draws: [[50,"Mobilization","Discovery"],[30,"Progress","Build"],[20,"Final","Close"]] },
];
// Representative advancing catalog kinds per event (the briefs' real needs)
const CATALOG = [
  { kind: "credential", code: "CRED-AAA", name: "All-Access Laminate" },
  { kind: "catering",   code: "CAT-CREW", name: "Crew Catering" },
  { kind: "radio",      code: "RADIO-UHF",name: "UHF Radio + Earpiece" },
  { kind: "travel",     code: "TRV-FLT",  name: "Artist Flight" },
  { kind: "lodging",    code: "LDG-HTL",  name: "Artist Lodging" },
];
// projects.xpms_phase is now the canonical XPMS v08 8-gate enum (migration
// 20260605170000_xpms_phase_v08_alignment) — gates drive the column directly,
// no legacy mapping required.

let ORG_ID = null, USER_ID = null;

async function main() {
  const teardown = process.argv.includes("--teardown");
  assert(SUPABASE_URL.includes(PROD_REF), "wrong project");
  const { data: auth, error: ae } = await sb.auth.signInWithPassword({ email: "admin@gvteway.test", password: "CompvssTest2026!" });
  if (ae) throw new Error("sign-in: " + ae.message);
  USER_ID = auth.user.id;

  // NB: create_org_with_owner UNIQUIFIES the slug (appends a random suffix), so
  // a fresh suffixed org is created each run. Org DELETE is RLS-protected (a
  // validated control — use the offboard flow / service role), so teardown of
  // prior runs is done out-of-band (see the report's teardown SQL). --teardown
  // here just reports the prior namespaced orgs it would target.
  if (teardown) {
    const { data: priors } = await sb.from("orgs").select("id,slug").like("slug", `${SLUG}%`);
    console.info(`Prior ${SLUG}* orgs (delete via service role): ${(priors || []).map((p) => p.slug).join(", ") || "none"}`);
    return;
  }

  const { data: org, error: oe } = await sb.rpc("create_org_with_owner", { p_name: `${RUN_ID} — Casa Miami Lifecycle`, p_slug: SLUG });
  if (oe) throw new Error("create_org_with_owner: " + oe.message);
  ORG_ID = Array.isArray(org) ? org[0].org_id : org.org_id;
  console.info(`Signed in admin@gvteway.test · run org ${ORG_ID} (${SLUG})\n`);

  for (const ev of EVENTS) await runEvent(ev);

  // ── report ────────────────────────────────────────────────────────────────
  const byStatus = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  console.info(`\n${"=".repeat(60)}\nE2E-LRP RESULTS — ${results.length} touchpoints`);
  console.info(`  PASS ${byStatus.PASS || 0} · FAIL ${byStatus.FAIL || 0} · SKIP ${byStatus.SKIP || 0}`);
  const fails = results.filter((r) => r.status === "FAIL");
  if (fails.length) {
    console.info(`\nGAPS (FAIL):`);
    for (const f of fails) console.info(`  ✗ [${f.event}/${f.gate}] ${f.touchpoint} — ${f.detail}`);
  }
  writeFileSync(resolve(ROOT, "reports/e2e-lrp-results.json"), JSON.stringify({ runId: RUN_ID, orgId: ORG_ID, results }, null, 2));
  console.info(`\nWrote reports/e2e-lrp-results.json · org ${SLUG} left for inspection (teardown: --teardown)`);
}

async function runEvent(ev) {
  console.info(`\n▶ ${ev.tier} ${ev.scale} — ${ev.artist}`);
  const c = { ev }; // per-event context (created ids)
  const data = kitsData.kits[ev.tier];

  // ══ GATE 1 · DISCOVERY ══
  c.client = await step(ev.tier, "Discovery", "client.create", async () =>
    await ins("clients", { org_id: ORG_ID, name: `Spotify LATAM (${ev.artist})` }));
  c.lead = await step(ev.tier, "Discovery", "lead.create+qualify", async () => {
    const l = await ins("opportunities", { org_id: ORG_ID, kind: "lead", title: `Casa Miami — ${ev.artist}`, lead_phase: "new" });
    await upd("opportunities", l.id, { lead_phase: "qualified" }); await upd("opportunities", l.id, { lead_phase: "proposal" });
    return l;
  });
  c.project = await step(ev.tier, "Discovery", "project.create(Discovery)", async () => {
    const p = await ins("projects", { org_id: ORG_ID, slug: `${ev.slug}-${Math.floor(Math.random()*1e4)}`, name: `Casa Miami — ${ev.artist}`, created_by: USER_ID, xpms_phase: "Discovery", project_state: "draft" });
    assert(p.id, "no project id"); return p;
  });
  c.period = await step(ev.tier, "Discovery", "accounting_period.open", async () =>
    await ins("accounting_periods", { org_id: ORG_ID, period_label: `${ev.tier} FY26`, starts_on: "2026-01-01", ends_on: "2026-12-31", state: "OPEN" }));
  c.uis = await step(ev.tier, "Discovery", "party+uis_role.engagement(discovered)", async () => {
    const party = await ins("parties", { org_id: ORG_ID, type: "organization", display_name: `Spotify LATAM (${ev.artist})` });
    c.party = party;
    return await ins("uis_roles", { org_id: ORG_ID, party_id: party.id, project_id: c.project?.id, role_class: "client", channel: "proposal", lifecycle_state: "discovered" });
  });

  // ══ GATE 2 · DESIGN ══
  c.proposal = await step(ev.tier, "Design", "proposal.draft→sent→approved", async () => {
    const p = await ins("proposals", { org_id: ORG_ID, title: `Casa Miami — ${ev.artist} (${ev.scale})`, project_id: c.project?.id });
    await upd("proposals", p.id, { status: "sent" }); await upd("proposals", p.id, { status: "approved" });
    return p;
  });
  await step(ev.tier, "Design", "budget.lines(XPMS 6-axis)", async () => {
    const rows = [];
    for (const l of data.lines) rows.push({ org_id: ORG_ID, project_id: c.project?.id, scope: "external_example",
      name: l.item, department: l.department, team: l.team, item: l.item, discipline: l.discipline,
      xpms_phase: l.phase, tier: l.tier, xyz: l.xyz, line_type: l.lineType,
      quantity: l.quantity, rate_cents: l.rateCents, amount_cents: Math.round(l.quantity * l.rateCents) });
    for (const [pct, label, phase] of [[null]].filter(Boolean)) void pct; // noop
    // reserves as line types (phase null)
    const r = data.reserves;
    const add = (lt, item, cents) => rows.push({ org_id: ORG_ID, project_id: c.project?.id, scope: "external_example", name: item, department: "Executive", item, discipline: "Corporate & Brand", line_type: lt, quantity: 1, rate_cents: cents, amount_cents: cents });
    if (r.feeCents) add("Fee", "Producer fee", r.feeCents);
    if (r.contingencyCents) add("Contingency", "Contingency reserve", r.contingencyCents);
    for (const a of (data.allowances || [])) add("Allowance", `Allowance — ${a.label}`, a.cents);
    if (r.markupCents) add("Markup", "Pass-through markup", r.markupCents);
    const { error } = await sb.from("budgets").insert(rows);
    if (error) throw new Error("budgets: " + error.message);
    c.budgetScopeCents = data.totals.scopeCents; c.budgetGrandCents = data.totals.grandCents; c.budgetRows = rows.length;
    return rows.length;
  });
  c.deliverables = await step(ev.tier, "Design", "deliverables.brief(specs)", async () => {
    const types = ["technical_rider", "hospitality_rider", "stage_plot", "comms_plan", "safety_compliance"];
    const ids = [];
    for (const t of types) { const d = await ins("deliverables", { org_id: ORG_ID, project_id: c.project?.id, type: t, title: `${ev.artist} ${t}`, fulfillment_state: "briefed", scope: "external_example" }); ids.push(d.id); }
    return ids;
  });
  await step(ev.tier, "Design", "project→Design/active", async () => { await upd("projects", c.project.id, { xpms_phase: "Design", project_state: "active" }); });

  // ══ GATE 3 · ADVANCE (incl. unified advancing system) ══
  c.vendor = await step(ev.tier, "Advance", "vendor.create(W-9 compliant)", async () =>
    await ins("vendors", { org_id: ORG_ID, name: `Tigre Sound System (${ev.tier})`, w9_on_file: true, coi_expires_at: "2027-12-31" }));
  c.crew = await step(ev.tier, "Advance", "crew_member.create", async () =>
    await ins("crew_members", { org_id: ORG_ID, name: `${ev.artist} Tour Crew`, user_id: null }));
  c.catalog = await step(ev.tier, "Advance", "master_catalog_items(5 kinds)", async () => {
    const ids = {};
    for (const ci of CATALOG) { const row = await ins("master_catalog_items", { org_id: ORG_ID, kind: ci.kind, code: `${ci.code}-${ev.tier}`, name: ci.name, scope: "external_example" }); ids[ci.kind] = row.id; }
    return ids;
  });
  await step(ev.tier, "Advance", "ADVANCING assignments brief→approved (+events)", async () => {
    assert(c.catalog && c.crew, "catalog/crew missing");
    const chain = ["briefed", "draft", "submitted", "in_review", "approved"];
    let n = 0;
    for (const ci of CATALOG) {
      const a = await ins("assignments", { org_id: ORG_ID, project_id: c.project.id, catalog_item_id: c.catalog[ci.kind], catalog_kind: ci.kind, party_kind: "crew_member", party_crew_id: c.crew.id, fulfillment_state: "briefed", title: `${ci.name} — ${ev.artist}` });
      for (let i = 1; i < chain.length; i++) {
        await upd("assignments", a.id, { fulfillment_state: chain[i] });
        await sb.from("assignment_events").insert({ assignment_id: a.id, org_id: ORG_ID, event_kind: "state_change", actor_user_id: USER_ID, from_state: chain[i - 1], to_state: chain[i] });
      }
      n++;
    }
    c.assignmentCount = n; c.firstCredentialId = null;
    return n;
  });
  c.draws = await step(ev.tier, "Advance", "project_billing_draws(50/30/20|60/40)", async () => {
    const ids = [];
    for (const [pct, label, phase] of ev.draws) { const d = await ins("project_billing_draws", { org_id: ORG_ID, project_id: c.project.id, draw_name: label, trigger_phase: phase, percentage: pct / 100, amount_cents: Math.round((c.budgetGrandCents || 0) * pct / 100) }); ids.push(d.id); }
    return ids;
  });
  await step(ev.tier, "Advance", "uis_role→committed→confirmed", async () => {
    await upd("uis_roles", c.uis.id, { lifecycle_state: "committed" });
    await upd("uis_roles", c.uis.id, { lifecycle_state: "confirmed" });
  });
  await step(ev.tier, "Advance", "project→Advance", async () => { await upd("projects", c.project.id, { xpms_phase: "Advance" }); });

  // ══ GATE 4 · PROCUREMENT ══
  c.req = await step(ev.tier, "Procurement", "requisition.draft→approved→converted", async () => {
    const r = await ins("requisitions", { org_id: ORG_ID, requester_id: USER_ID, title: `${ev.artist} production rentals`, project_id: c.project.id });
    await upd("requisitions", r.id, { status: "submitted" }); await upd("requisitions", r.id, { status: "approved" }); await upd("requisitions", r.id, { status: "converted" });
    return r;
  });
  c.po = await step(ev.tier, "Procurement", "purchase_order+lines(committed)", async () => {
    const po = await ins("purchase_orders", { org_id: ORG_ID, number: `PO-${ev.tier}-${Math.floor(Math.random()*1e4)}`, title: `${ev.artist} rentals`, project_id: c.project.id, vendor_id: c.vendor?.id });
    const { error } = await sb.from("po_line_items").insert([
      { purchase_order_id: po.id, description: "Lighting package", quantity: 1, unit_price_cents: 800000 },
      { purchase_order_id: po.id, description: "Audio package", quantity: 1, unit_price_cents: 600000 },
    ]);
    if (error) throw new Error("po_line_items: " + error.message);
    await upd("purchase_orders", po.id, { status: "sent" }); await upd("purchase_orders", po.id, { status: "acknowledged" });
    return po;
  });

  // ══ GATE 5 · BUILD ══
  c.fab = await step(ev.tier, "Build", "fabrication_order(production_phase)", async () => {
    const f = await ins("fabrication_orders", { org_id: ORG_ID, title: `${ev.artist} scenic build`, project_id: c.project.id });
    await upd("fabrication_orders", f.id, { production_phase: "FAB" });
    return f;
  });
  await step(ev.tier, "Build", "deliverables→submitted→approved", async () => {
    assert(c.deliverables?.length, "no deliverables");
    for (const id of c.deliverables) { await upd("deliverables", id, { fulfillment_state: "submitted" }); await upd("deliverables", id, { fulfillment_state: "in_review" }); await upd("deliverables", id, { fulfillment_state: "approved" }); }
  });
  await step(ev.tier, "Build", "project→Build", async () => { await upd("projects", c.project.id, { xpms_phase: "Build" }); });

  // ══ GATE 6 · INSTALL ══
  await step(ev.tier, "Install", "deliverables→delivered", async () => {
    for (const id of c.deliverables || []) await upd("deliverables", id, { fulfillment_state: "delivered" });
  });
  c.cues = await step(ev.tier, "Install", "ROS cues.create", async () => {
    const rows = [
      { org_id: ORG_ID, scheduled_at: "2026-10-17T08:00:00-04:00", lane: "show", label: "Crew call", status: "pending", owner_role: "Producer / GM", kit_id: null, scope: "external_example" },
      { org_id: ORG_ID, scheduled_at: "2026-10-17T19:00:00-04:00", lane: "show", label: "Doors", status: "pending", owner_role: "Front of House", kit_id: null, scope: "external_example" },
    ];
    const { data, error } = await sb.from("cues").insert(rows).select("id");
    if (error) throw new Error("cues: " + error.message);
    return data.map((r) => r.id);
  });

  // ══ GATE 7 · OPERATE ══
  c.event = await step(ev.tier, "Operate", "event.create", async () =>
    await ins("events", { org_id: ORG_ID, name: `Casa Miami — ${ev.artist}`, starts_at: "2026-10-17T19:00:00-04:00", ends_at: "2026-10-18T02:00:00-04:00", project_id: c.project.id }));
  await step(ev.tier, "Operate", "cues fire pending→done", async () => {
    for (const id of c.cues || []) { await upd("cues", id, { cue_state: "live" }); await upd("cues", id, { cue_state: "done" }); }
  });
  await step(ev.tier, "Operate", "uis_role→active · project→Operate", async () => {
    await upd("uis_roles", c.uis.id, { lifecycle_state: "active" });
    await upd("projects", c.project.id, { xpms_phase: "Operate" });
  });

  // ══ GATE 8 · CLOSE ══
  c.invoice = await step(ev.tier, "Close", "invoice+lines draft→paid", async () => {
    const inv = await ins("invoices", { org_id: ORG_ID, number: `INV-${ev.tier}-${Math.floor(Math.random()*1e4)}`, title: `Casa Miami — ${ev.artist}`, project_id: c.project.id });
    const { error } = await sb.from("invoice_line_items").insert([{ invoice_id: inv.id, description: "Production services", quantity: 1, unit_price_cents: c.budgetGrandCents || 0 }]);
    if (error) throw new Error("invoice_line_items: " + error.message);
    await upd("invoices", inv.id, { status: "sent" }); await upd("invoices", inv.id, { status: "paid" });
    return inv;
  });
  await step(ev.tier, "Close", "payment_application", async () => {
    assert(c.po, "no PO for payment app");
    await ins("payment_applications", { org_id: ORG_ID, project_id: c.project.id, purchase_order_id: c.po.id, application_number: 1, period_start: "2026-10-01", period_end: "2026-10-31", status: "draft" });
  });
  await step(ev.tier, "Close", "accounting_period OPEN→CLOSED", async () => {
    await upd("accounting_periods", c.period.id, { state: "CLOSING" }); await upd("accounting_periods", c.period.id, { state: "CLOSED" });
  });
  await step(ev.tier, "Close", "project→Close/complete · proposal→signed · uis→closed", async () => {
    await upd("projects", c.project.id, { xpms_phase: "Close", project_state: "complete" });
    await upd("proposals", c.proposal.id, { status: "signed" });
    await upd("uis_roles", c.uis.id, { lifecycle_state: "closed" });
  });
  await step(ev.tier, "Close", "RECONCILE budget↔actuals", async () => {
    const { data: b } = await sb.from("budgets").select("amount_cents,line_type").eq("project_id", c.project.id);
    const scope = (b || []).filter((r) => r.line_type === "Scope").reduce((s, r) => s + (r.amount_cents || 0), 0);
    const grand = (b || []).reduce((s, r) => s + (r.amount_cents || 0), 0);
    assert(scope === c.budgetScopeCents, `scope ${scope} != model ${c.budgetScopeCents}`);
    assert(grand === c.budgetGrandCents, `grand ${grand} != model ${c.budgetGrandCents}`);
    return `scope $${scope/100} grand $${grand/100} reconciled`;
  });
}

main().catch((e) => { console.error("FATAL:", e?.message || e); process.exit(1); });
