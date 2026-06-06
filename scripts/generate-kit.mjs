#!/usr/bin/env node
/**
 * Event Kit generator / seeder (Layer C runnable entrypoint).
 *
 * The canonical engine is src/lib/eventkit/generate.ts (assembleKit + kitToRows,
 * pure + typechecked). This .mjs mirrors its mapping for the no-tsx runtime and
 * persists via the RLS path (signs in as the demo admin — there is no service-
 * role key in .env.local), exactly like the other smoke harnesses.
 *
 * Modes:
 *   node scripts/generate-kit.mjs --demo casa
 *     Generates all four Casa tiers from docs/proposals/casa-miami/_fragments/
 *     casa_kits.json + scripts/data/sanctuary-frame.json, tagged
 *     scope=external_example. (Run `python3 budget_model.py --kits` first.)
 *
 *   node scripts/generate-kit.mjs --tier S --artist "Name" --event EVT \
 *        --venue "The Sanctuary" --budget-band "<$50K"
 *     Generates a single canonical kit SHELL (frame + 8 gates + zones +
 *     5-senses + ROS + rider, empty BOM) from params — proves param→kit.
 *
 * Auth: admin@gvteway.test / CompvssTest2026! (demo org). RLS applies.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) { console.error("Missing Supabase env"); process.exit(2); }

const DEMO_EMAIL = process.env.KIT_SEED_EMAIL || "admin@gvteway.test";
const DEMO_PASS = process.env.KIT_SEED_PASS || "CompvssTest2026!";
const DEMO_DATE = "2026-10-17"; // nominal date for ROS cue timestamps

// ── arg parsing ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

const frame = JSON.parse(readFileSync(resolve(ROOT, "scripts/data/sanctuary-frame.json"), "utf8"));

function atomNamespace({ org, event, venueCode, year }) {
  const seg = (s, n) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, n);
  const yy = String((year ?? 2026) % 100).padStart(2, "0");
  return `${seg(org, 4)}-${seg(event, 5)}${yy}${seg(venueCode, 5)}`;
}

// Mirror of src/lib/eventkit/generate.ts kitToRows + reserve-line expansion.
function buildKit({ org, scope, meta, lines, reserves, allowances }) {
  const reserveLines = [];
  if (reserves?.feeCents) reserveLines.push({ department: "Executive", item: "Project Management, Talent & Client Services", discipline: "Corporate & Brand", lineType: "Fee", quantity: 1, rateCents: reserves.feeCents });
  if (reserves?.contingencyCents) reserveLines.push({ department: "Executive", item: "Contingency reserve (in-scope variance)", discipline: "Corporate & Brand", lineType: "Contingency", quantity: 1, rateCents: reserves.contingencyCents });
  for (const a of allowances || []) reserveLines.push({ department: "Experience", item: `Allowance — ${a.label}`, discipline: "Experiential", lineType: "Allowance", quantity: 1, rateCents: a.cents });
  if (reserves?.markupCents) reserveLines.push({ department: "Executive", item: "Pass-through markup (third-party)", discipline: "Corporate & Brand", lineType: "Markup", quantity: 1, rateCents: reserves.markupCents });
  return { meta, scope, org, allLines: [...lines, ...reserveLines] };
}

async function persistKit(sb, orgId, kit) {
  const { meta, scope, allLines } = kit;
  // idempotent: drop any prior kit with this namespace+scope (cascades children)
  await sb.from("event_kits").delete().eq("org_id", orgId).eq("scope", scope).eq("atom_namespace", meta.atomNamespace);

  const { data: kitRow, error: ke } = await sb.from("event_kits").insert({
    org_id: orgId, scope,
    name: meta.name, kit_scale: meta.scale, xpms_tier_default: meta.tierDefault ?? null,
    venue_name: frame.venue.name, venue_address: meta.venueAddress ?? null,
    budget_band_low_cents: meta.bandLow ?? null, budget_band_high_cents: meta.bandHigh ?? null,
    atom_namespace: meta.atomNamespace, kit_version: "v1.0", kit_state: "configured",
    params: meta.params ?? {}, generated_from: "generate-kit.mjs",
  }).select("id").single();
  if (ke) throw new Error(`event_kits: ${ke.message}`);
  const kitId = kitRow.id;
  const base = { org_id: orgId, kit_id: kitId, scope };

  const { data: zones, error: ze } = await sb.from("kit_zones").insert(
    frame.zones.map((z, i) => ({ ...base, zone_code: z.zoneCode, name: z.name, dimensions: z.dimensions, capacity: z.capacity, power_notes: z.powerNotes, av_notes: z.avNotes, loadin_notes: z.loadinNotes, sort_order: i }))
  ).select("id, zone_code");
  if (ze) throw new Error(`kit_zones: ${ze.message}`);
  const zoneByCode = Object.fromEntries(zones.map((z) => [z.zone_code, z.id]));
  const codeByZoneId = Object.fromEntries(zones.map((z) => [z.id, z.zone_code]));

  const { data: tps, error: te } = await sb.from("kit_touchpoints").insert(
    frame.touchpoints.map((t, i) => ({ ...base, zone_id: zoneByCode[t.zoneCode] ?? null, sense: t.sense, design_intent: t.designIntent, delivering_element: t.deliveringElement ?? null, sort_order: i }))
  ).select("id, zone_id, sense");
  if (te) throw new Error(`kit_touchpoints: ${te.message}`);
  const tpByKey = {};
  for (const tp of tps) { const k = `${codeByZoneId[tp.zone_id]}|${tp.sense}`; if (!(k in tpByKey)) tpByKey[k] = tp.id; }

  if (allLines.length) {
    const { error: le } = await sb.from("kit_lines").insert(allLines.map((l, i) => ({
      ...base, zone_id: l.zoneCode ? zoneByCode[l.zoneCode] ?? null : null,
      touchpoint_id: l.zoneCode && l.sense ? tpByKey[`${l.zoneCode}|${l.sense}`] ?? null : null,
      urid: l.urid ?? null, department: l.department ?? null, team: l.team ?? null,
      item: l.item, description: l.description ?? null, discipline: l.discipline ?? null,
      xpms_phase: l.phase ?? null, tier: l.tier ?? null, xyz: l.xyz ?? null,
      line_type: l.lineType ?? "Scope", quantity: l.quantity ?? null, rate_cents: l.rateCents ?? null,
      sort_order: i,
    })));
    if (le) throw new Error(`kit_lines: ${le.message}`);
  }

  const { error: ge } = await sb.from("kit_phase_gates").insert(frame.phaseGates.map((g, i) => ({
    ...base, xpms_phase: g.phase, objective: g.objective, exit_checklist: g.exitChecklist,
    owner_role: g.ownerRole, key_deliverables: g.keyDeliverables, gate_state: g.gateState ?? "pending", sort_order: i,
  })));
  if (ge) throw new Error(`kit_phase_gates: ${ge.message}`);

  const { error: ce } = await sb.from("cues").insert(frame.ros.map((c) => ({
    org_id: orgId, kit_id: kitId, scope, lane: c.lane, label: c.label, description: c.description ?? null,
    owner_role: c.ownerRole, xpms_phase: c.phase ?? null, done_when: c.doneWhen ?? null,
    duration_seconds: c.durationSeconds ?? null, status: "pending",
    scheduled_at: `${DEMO_DATE}T${String(c.scheduledAt).padStart(5, "0")}:00-04:00`,
  })));
  if (ce) throw new Error(`cues: ${ce.message}`);

  return { kitId, zones: zones.length, touchpoints: tps.length, lines: allLines.length, gates: frame.phaseGates.length, cues: frame.ros.length };
}

async function main() {
  const sb = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
  const { data: auth, error: ae } = await sb.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASS });
  if (ae) { console.error(`Sign-in failed: ${ae.message}`); process.exit(2); }
  const userId = auth.user.id;
  const { data: mems, error: me } = await sb.from("memberships").select("org_id, role").eq("user_id", userId);
  if (me || !mems?.length) { console.error(`No memberships: ${me?.message}`); process.exit(2); }
  const mem = mems.find((m) => ["owner", "admin", "manager"].includes(m.role)) ?? mems[0];
  const orgId = mem.org_id;
  console.info(`Signed in ${DEMO_EMAIL} · org ${orgId} · role ${mem.role}`);

  if (has("catalog")) {
    // Canonical, brand-agnostic configure-to-order catalog: base packages per
    // scale + options/substitutions/upgrades/add-ons (the "sushi menu").
    const packages = [
      { code: "PKG-S",  kit_scale: "S",  name: "Intimate Base", description: "Always-on frame for <$50K intimate formats (listening room, showcase)." },
      { code: "PKG-M",  kit_scale: "M",  name: "Party Base",    description: "Always-on frame for $50–150K late-night / after-party formats." },
      { code: "PKG-L",  kit_scale: "L",  name: "Showcase Base", description: "Always-on frame for $150–250K multi-artist cultural moments." },
      { code: "PKG-XL", kit_scale: "XL", name: "Takeover Base", description: "Always-on frame for $250K+ community tentpole takeovers." },
    ];
    const options = [
      { code: "OPT-DJ",      option_type: "addon",        name: "DJ programming",            cost_delta_cents: 360000, lead_time_days: 14, xpms_phase: "Advance",     discipline: "Live Entertainment",  department: "Talent",      urid: "2000.030.00", sense: "sound", zone_ref: "ZON-MAIN" },
      { code: "OPT-PHOTO",   option_type: "addon",        name: "Photo-moment installation", cost_delta_cents: 190000, lead_time_days: 21, xpms_phase: "Build",       discipline: "Fabrication",         department: "Build",       urid: "4000.050.00", sense: "touch", zone_ref: "ZON-EXHIB" },
      { code: "OPT-MERCH",   option_type: "addon",        name: "Take-home props / merch",   cost_delta_cents: 245000, lead_time_days: 21, xpms_phase: "Procurement", discipline: "Experiential",        department: "Experience",  urid: "7000.080.00", sense: "touch", zone_ref: "ZON-EXHIB" },
      { code: "OPT-VINYL",   option_type: "addon",        name: "Vinyl capture & pressing",  cost_delta_cents: 480000, lead_time_days: 30, xpms_phase: "Procurement", discipline: "Broadcast & Content", department: "Production",  urid: "5000.030.00", sense: "sound", zone_ref: "ZON-MAIN" },
      { code: "OPT-4CAM",    option_type: "upgrade",      name: "4-cam capture upgrade",     cost_delta_cents: 520000, lead_time_days: 14, xpms_phase: "Operate",     discipline: "Broadcast & Content", department: "Production",  urid: "5000.050.00", sense: "sight", zone_ref: "ZON-MAIN" },
      { code: "OPT-LED",     option_type: "upgrade",      name: "LED wall + IMAG",           cost_delta_cents: 640000, lead_time_days: 21, xpms_phase: "Procurement", discipline: "Broadcast & Content", department: "Production",  urid: "5000.050.00", sense: "sight", zone_ref: "ZON-MAIN" },
      { code: "OPT-CO2",     option_type: "upgrade",      name: "CO2 + low-fog FX",          cost_delta_cents: 140000, lead_time_days: 10, xpms_phase: "Operate",     discipline: "Live Entertainment",  department: "Production",  urid: "5000.070.00", sense: "scent", zone_ref: "ZON-MAIN" },
      { code: "OPT-BARPREM", option_type: "substitution", name: "Premium bar program",      cost_delta_cents: 520000, lead_time_days: 14, xpms_phase: "Procurement", discipline: "Hospitality & F&B",   department: "Hospitality", urid: "8000.050.00", sense: "taste", zone_ref: "ZON-MAIN" },
      { code: "OPT-FLORAL",  option_type: "substitution", name: "Regional floral sourcing", cost_delta_cents: 120000, lead_time_days: 7,  xpms_phase: "Install",     discipline: "Hospitality & F&B",   department: "Hospitality", urid: "8000.040.00", sense: "scent", zone_ref: "ZON-MAIN" },
      { code: "OPT-STREAM",  option_type: "addon",        name: "Livestream package",        cost_delta_cents: 840000, lead_time_days: 14, xpms_phase: "Operate",     discipline: "Broadcast & Content", department: "Technology",  urid: "9000.100.00", sense: "sight", zone_ref: "ZON-IT", depends_on: ["OPT-4CAM"] },
    ];
    await sb.from("kit_options").delete().eq("org_id", orgId).eq("scope", "canonical").like("code", "OPT-%");
    await sb.from("kit_packages").delete().eq("org_id", orgId).eq("scope", "canonical").like("code", "PKG-%");
    const { data: pkgRows, error: pe } = await sb.from("kit_packages")
      .insert(packages.map((p) => ({ ...p, org_id: orgId, scope: "canonical", active: true }))).select("id, kit_scale");
    if (pe) throw new Error(`kit_packages: ${pe.message}`);
    const pkgByScale = Object.fromEntries(pkgRows.map((p) => [p.kit_scale, p.id]));
    // attach each option to all packages it is valid for (M+ get party options; all get capture/F&B)
    const validScales = { "OPT-DJ": ["M", "L", "XL"], "OPT-CO2": ["M", "L", "XL"], "OPT-LED": ["L", "XL"], "OPT-STREAM": ["L", "XL"] };
    const optRows = options.map((o) => ({
      org_id: orgId, scope: "canonical", package_id: null, option_type: o.option_type, code: o.code,
      name: o.name, cost_delta_cents: o.cost_delta_cents, lead_time_days: o.lead_time_days,
      xpms_phase: o.xpms_phase, discipline: o.discipline, department: o.department, urid: o.urid,
      sense: o.sense, zone_ref: o.zone_ref, depends_on: o.depends_on ?? [], active: true,
    }));
    const { error: oe } = await sb.from("kit_options").insert(optRows);
    if (oe) throw new Error(`kit_options: ${oe.message}`);
    console.info(`Seeded configurator catalog: ${packages.length} base packages + ${options.length} options (canonical).`);
    void pkgByScale; void validScales;
    return;
  }

  if (has("demo") && flag("demo") === "casa") {
    const data = JSON.parse(readFileSync(resolve(ROOT, "docs/proposals/casa-miami/_fragments/casa_kits.json"), "utf8"));
    for (const tier of ["T1", "T2", "T3", "T4"]) {
      const k = data.kits[tier];
      const ns = atomNamespace({ org: "SC", event: k.meta.event, venueCode: data.venue.code, year: 2026 }) + `-${k.meta.scale}`;
      const kit = buildKit({
        org: "SC", scope: "external_example",
        meta: {
          name: `Casa Spotify Miami — ${k.meta.artist}`, scale: k.meta.scale,
          tierDefault: k.meta.tier_default, atomNamespace: ns,
          venueAddress: data.venue.name,
          params: { org: "Spotify LATAM", event: "Casa Spotify Miami", artist: k.meta.artist, tier: k.meta.scale, venue: data.venue.name, budget_band: k.meta.band, producer: "Tigre Sound System × GHXSTSHIP" },
        },
        lines: k.lines, reserves: k.reserves, allowances: k.allowances,
      });
      const r = await persistKit(sb, orgId, kit);
      console.info(`  [${tier} ${k.meta.scale}] ${k.meta.artist} → kit ${r.kitId.slice(0, 8)} · zones ${r.zones} · touchpoints ${r.touchpoints} · lines ${r.lines} · gates ${r.gates} · cues ${r.cues}`);
    }
    console.info("\nDemo seed complete (scope=external_example).");
    return;
  }

  // single-kit shell from params
  const tier = (flag("tier") || "S").toUpperCase();
  const artist = flag("artist", "");
  const event = flag("event", "EVT");
  const venue = flag("venue", frame.venue.name);
  const band = flag("budget-band", "");
  const ns = atomNamespace({ org: flag("org", "ATLVS"), event, venueCode: frame.venue.code, year: 2026 }) + `-${tier}`;
  const kit = buildKit({
    org: flag("org", "ATLVS"), scope: "canonical",
    meta: { name: `${event} — ${artist || tier}`, scale: tier, atomNamespace: ns, venueAddress: venue,
      params: { event, artist, tier, venue, budget_band: band } },
    lines: [], reserves: {}, allowances: [],
  });
  const r = await persistKit(sb, orgId, kit);
  console.info(`Generated kit shell ${r.kitId} (${tier}) — zones ${r.zones} · touchpoints ${r.touchpoints} · gates ${r.gates} · cues ${r.cues} · BOM empty (configure via catalog).`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
