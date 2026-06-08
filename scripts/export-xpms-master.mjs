#!/usr/bin/env node
/**
 * Export the applied ATLVS Master XPMS Catalog from the DB to .xlsx.
 * Reads master_catalog_items (demo org, canonical, live), enriches with source
 * reference attributes from scripts/.xpms-catalog.json by code. Matches the DB.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const ORG = "68672cc3-0667-4234-ad77-49325e173175";
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
await sb.auth.signInWithPassword({ email: "admin@gvteway.test", password: "CompvssTest2026!" });

const { records } = JSON.parse(readFileSync(resolve(ROOT, "scripts/.xpms-catalog.json"), "utf8"));
const ref = Object.fromEntries(records.map((r) => [r.code, r]));

const all = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("master_catalog_items")
    .select("kind, code, name, description, unit_cost_cents, urid, xpms_department, discipline, default_tier, default_phase, xyz")
    .eq("org_id", ORG).eq("scope", "canonical").is("deleted_at", null)
    .order("xpms_department").order("urid").order("name").range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  all.push(...data);
  if (data.length < 1000) break;
}

const wb = new ExcelJS.Workbook();
wb.creator = "ATLVS Technologies";
const RED = "FFB91C1C";
const head = (ws) => {
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
};

const byDept = {}, byKind = {};
for (const r of all) { byDept[r.xpms_department] = (byDept[r.xpms_department] || 0) + 1; byKind[r.kind] = (byKind[r.kind] || 0) + 1; }
const ov = wb.addWorksheet("Overview");
ov.columns = [{ header: "Group", key: "g", width: 32 }, { header: "Count", key: "n", width: 10 }];
head(ov);
ov.addRow({ g: "— By XPMS Department —", n: "" });
for (const [d, n] of Object.entries(byDept).sort((a, b) => b[1] - a[1])) ov.addRow({ g: d, n });
ov.addRow({ g: "", n: "" }); ov.addRow({ g: "— By catalog_kind —", n: "" });
for (const [k, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) ov.addRow({ g: k, n });
ov.addRow({ g: "", n: "" }); ov.addRow({ g: "TOTAL (canonical, live)", n: all.length });

const ws = wb.addWorksheet("Master XPMS Catalog");
ws.columns = [
  { header: "Code", key: "code", width: 20 },
  { header: "Name", key: "name", width: 46 },
  { header: "Kind", key: "kind", width: 12 },
  { header: "URID", key: "urid", width: 12 },
  { header: "Department", key: "dept", width: 13 },
  { header: "Discipline", key: "disc", width: 20 },
  { header: "Default Tier", key: "tier", width: 13 },
  { header: "Default Phase", key: "phase", width: 13 },
  { header: "XYZ", key: "xyz", width: 18 },
  { header: "Unit Cost USD", key: "cost", width: 13, style: { numFmt: "#,##0.00" } },
  { header: "Std $ Low", key: "lo", width: 10 },
  { header: "Std $ High", key: "hi", width: 10 },
  { header: "Description", key: "desc", width: 54 },
  { header: "Specifications", key: "spec", width: 50 },
  { header: "Lead Time (hrs)", key: "lead", width: 14 },
  { header: "Crew", key: "crew", width: 22 },
];
head(ws);
ws.getColumn("desc").alignment = { wrapText: true, vertical: "top" };
ws.getColumn("spec").alignment = { wrapText: true, vertical: "top" };
for (const r of all) {
  const x = ref[r.code] || {};
  ws.addRow({
    code: r.code, name: r.name, kind: r.kind, urid: r.urid, dept: r.xpms_department,
    disc: r.discipline, tier: r.default_tier, phase: r.default_phase, xyz: r.xyz,
    cost: r.unit_cost_cents == null ? null : r.unit_cost_cents / 100,
    lo: x.std_low ?? null, hi: x.std_high ?? null, desc: r.description,
    spec: x.specifications ?? null, lead: x.lead_time_hours ?? null, crew: x.crew ?? null,
  });
}

const out = resolve(ROOT, "xpms-master-catalog.xlsx");
await wb.xlsx.writeFile(out);
console.log(`Wrote ${out} — ${all.length} rows`);
console.log("dept:", JSON.stringify(byDept), "kind:", JSON.stringify(byKind));
