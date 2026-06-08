#!/usr/bin/env node
/**
 * One-off: export all XPMS asset catalogs to a single merged .xlsx.
 *   node scripts/export-catalogs.mjs [outfile]
 * Auth: demo admin via anon key (RLS applies), mirrors generate-kit.mjs.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { error: ae } = await sb.auth.signInWithPassword({ email: "admin@gvteway.test", password: "CompvssTest2026!" });
if (ae) { console.error("sign-in:", ae.message); process.exit(2); }

const usd = (c) => (c == null ? null : Number((c / 100).toFixed(2)));

// ── pull every catalog (RLS-scoped to demo org) ──────────────────────────────
const { data: mci } = await sb.from("master_catalog_items")
  .select("kind, code, name, description, unit_cost_cents, currency, inventory_qty, active, scope")
  .is("deleted_at", null).order("kind").order("code");
const { data: pkgs } = await sb.from("kit_packages")
  .select("code, kit_scale, name, description, scope, active").order("kit_scale");
const { data: opts } = await sb.from("kit_options")
  .select("code, option_type, name, cost_delta_cents, lead_time_days, xpms_phase, discipline, department, urid, sense, zone_ref, depends_on, scope, active")
  .order("option_type").order("code");
const { data: kits } = await sb.from("event_kits").select("id, name, kit_scale").order("kit_scale");
const kitById = Object.fromEntries((kits || []).map((k) => [k.id, k]));
const { data: lines } = await sb.from("kit_lines")
  .select("kit_id, urid, department, team, item, discipline, xpms_phase, tier, xyz, line_type, quantity, rate_cents, zone_id, sort_order")
  .order("sort_order");
const { data: zones } = await sb.from("kit_zones").select("id, zone_code");
const zoneById = Object.fromEntries((zones || []).map((z) => [z.id, z.zone_code]));

// ── build workbook ───────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "ATLVS Technologies";
const RED = "FFB91C1C";
const head = (ws) => {
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
};

// 1. Overview
const ov = wb.addWorksheet("Overview");
ov.columns = [
  { header: "Catalog", key: "c", width: 26 },
  { header: "Sheet", key: "s", width: 22 },
  { header: "Items", key: "n", width: 8 },
  { header: "Source", key: "src", width: 34 },
  { header: "Notes", key: "note", width: 70 },
];
head(ov);
ov.addRows([
  { c: "Master Catalog Items", s: "Master Catalog", n: mci.length, src: "public.master_catalog_items", note: "Org-scoped reusable inventory SKUs across 10 kinds. Includes canonical + external_example (Casa demo) + a few e2e-* test rows." },
  { c: "Kit Configurator — Packages", s: "Kit Configurator", n: pkgs.length, src: "public.kit_packages", note: "Always-on base packages, one per scale (S/M/L/XL)." },
  { c: "Kit Configurator — Options", s: "Kit Configurator", n: opts.length, src: "public.kit_options", note: "Add-ons / upgrades / substitutions — the configure-to-order menu." },
  { c: "Kit Lines (BOM)", s: "Kit Lines (BOM)", n: lines.length, src: "public.kit_lines × event_kits", note: "Budget-of-materials lines across the 4 Casa Spotify Miami demo kits (T1–T4)." },
]);

// 2. Master Catalog
const mc = wb.addWorksheet("Master Catalog");
mc.columns = [
  { header: "Kind", key: "kind", width: 13 },
  { header: "Code", key: "code", width: 24 },
  { header: "Name", key: "name", width: 48 },
  { header: "Description", key: "description", width: 60 },
  { header: "Unit Cost (USD)", key: "cost", width: 16, style: { numFmt: '#,##0.00' } },
  { header: "Currency", key: "currency", width: 9 },
  { header: "Inventory Qty", key: "qty", width: 13 },
  { header: "Active", key: "active", width: 8 },
  { header: "Scope", key: "scope", width: 18 },
];
head(mc);
mc.addRows(mci.map((r) => ({ ...r, cost: usd(r.unit_cost_cents), qty: r.inventory_qty })));

// 3. Kit Configurator (packages then options, in one sheet with a blank divider)
const kc = wb.addWorksheet("Kit Configurator");
kc.columns = [
  { header: "Code", key: "code", width: 14 },
  { header: "Type", key: "type", width: 13 },
  { header: "Name", key: "name", width: 34 },
  { header: "Scale", key: "scale", width: 7 },
  { header: "Cost Δ (USD)", key: "cost", width: 13, style: { numFmt: '#,##0.00' } },
  { header: "Lead Days", key: "lead", width: 10 },
  { header: "Phase", key: "phase", width: 13 },
  { header: "Discipline", key: "discipline", width: 22 },
  { header: "Department", key: "department", width: 13 },
  { header: "URID", key: "urid", width: 12 },
  { header: "Sense", key: "sense", width: 8 },
  { header: "Zone", key: "zone", width: 12 },
  { header: "Depends On", key: "depends", width: 14 },
  { header: "Description", key: "description", width: 56 },
  { header: "Scope", key: "scope", width: 12 },
];
head(kc);
kc.addRows(pkgs.map((p) => ({ code: p.code, type: "package", name: p.name, scale: p.kit_scale, description: p.description, scope: p.scope })));
kc.addRows(opts.map((o) => ({
  code: o.code, type: o.option_type, name: o.name, cost: usd(o.cost_delta_cents), lead: o.lead_time_days,
  phase: o.xpms_phase, discipline: o.discipline, department: o.department, urid: o.urid, sense: o.sense,
  zone: o.zone_ref, depends: (o.depends_on || []).join(", "), scope: o.scope,
})));

// 4. Kit Lines (BOM)
const kl = wb.addWorksheet("Kit Lines (BOM)");
kl.columns = [
  { header: "Kit", key: "kit", width: 56 },
  { header: "Scale", key: "scale", width: 7 },
  { header: "URID", key: "urid", width: 12 },
  { header: "Department", key: "department", width: 13 },
  { header: "Team", key: "team", width: 24 },
  { header: "Item", key: "item", width: 50 },
  { header: "Discipline", key: "discipline", width: 22 },
  { header: "Phase", key: "phase", width: 13 },
  { header: "Tier", key: "tier", width: 16 },
  { header: "XYZ", key: "xyz", width: 16 },
  { header: "Line Type", key: "line_type", width: 12 },
  { header: "Qty", key: "qty", width: 8 },
  { header: "Rate (USD)", key: "rate", width: 13, style: { numFmt: '#,##0.00' } },
  { header: "Line Total (USD)", key: "total", width: 16, style: { numFmt: '#,##0.00' } },
  { header: "Zone", key: "zone", width: 12 },
];
head(kl);
kl.addRows((lines || []).map((l) => {
  const k = kitById[l.kit_id] || {};
  const qty = l.quantity == null ? null : Number(l.quantity);
  return {
    kit: k.name, scale: k.kit_scale, urid: l.urid, department: l.department, team: l.team, item: l.item,
    discipline: l.discipline, phase: l.xpms_phase, tier: l.tier, xyz: l.xyz, line_type: l.line_type,
    qty, rate: usd(l.rate_cents), total: usd(qty != null && l.rate_cents != null ? qty * l.rate_cents : null),
    zone: zoneById[l.zone_id] || null,
  };
}));

const out = resolve(ROOT, process.argv[2] || "xpms-asset-catalogs.xlsx");
await wb.xlsx.writeFile(out);
console.log(`Wrote ${out} — Master ${mci.length} · Packages ${pkgs.length} · Options ${opts.length} · Lines ${(lines || []).length}`);
