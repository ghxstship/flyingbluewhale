"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { dollarsToCents } from "@/lib/format";
import {
  XPMS_DEPARTMENTS,
  XPMS_DISCIPLINES,
  XPMS_LINE_TYPES,
  XPMS_PHASES,
  XPMS_TIERS,
  XPMS_XYZ,
} from "@/lib/finance/xpms-budget";

/**
 * CSV / TSV import for the XPMS Budget sheet.
 *
 * Mirrors the column order of the template's Budget tab (rows 2-N):
 *   RECORD ID | PROJECT | EVENT | LOCATION | ACTIVATION | DEPARTMENT |
 *   TEAM | CLASS | ITEM | DESCRIPTION | DISCIPLINE | PHASE | TIER |
 *   XYZ | LINE TYPE | QUANTITY | RATE | ESTIMATE | BUDGET | COMMITTED |
 *   FORECAST | ACTUAL | VARIANCE | VENDOR | STATUS | FLAG |
 *   EXTERNAL NOTES | INTERNAL NOTES
 *
 * Format detection: auto — splits on tab when present, otherwise CSV.
 * Header row required and must match the canonical column names (case
 * insensitive). Empty cells are coerced to null. ESTIMATE/VARIANCE are
 * skipped on insert (the DB trigger computes ESTIMATE; VARIANCE is a
 * derived read-time column).
 *
 * Project resolution: the PROJECT column accepts either a project name
 * or a project ID (UUID). Names are resolved against the caller's
 * organisation; unknown names are skipped with an error.
 */

export type State =
  | { error?: string; ok?: never }
  | { ok: true; inserted: number; skipped: Array<{ row: number; reason: string }> }
  | null;

type CanonicalKey =
  | "record_id"
  | "project"
  | "event"
  | "location"
  | "activation"
  | "department"
  | "team"
  | "class"
  | "item"
  | "description"
  | "discipline"
  | "xpms_phase"
  | "tier"
  | "xyz"
  | "line_type"
  | "quantity"
  | "rate"
  | "estimate"
  | "amount"
  | "committed"
  | "forecast"
  | "actual"
  | "variance"
  | "vendor"
  | "status"
  | "flag"
  | "external_notes"
  | "internal_notes";

const HEADER_MAP: Record<string, CanonicalKey> = {
  "record id": "record_id",
  project: "project",
  event: "event",
  location: "location",
  activation: "activation",
  department: "department",
  team: "team",
  class: "class",
  item: "item",
  description: "description",
  discipline: "discipline",
  phase: "xpms_phase",
  tier: "tier",
  xyz: "xyz",
  "line type": "line_type",
  quantity: "quantity",
  rate: "rate",
  estimate: "estimate",
  budget: "amount",
  committed: "committed",
  forecast: "forecast",
  actual: "actual",
  variance: "variance",
  vendor: "vendor",
  status: "status",
  flag: "flag",
  "external notes": "external_notes",
  "internal notes": "internal_notes",
};

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes("\t")) return "\t";
  return ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  // Minimal CSV parser supporting quoted cells with embedded delimiter
  // and "" escapes. Acceptable for the XPMS template paste path; the
  // separate bulk-loader path can use a hardened library later.
  if (delimiter === "\t") return line.split("\t");
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function nullable(v: string): string | null {
  const t = v.trim();
  return t === "" || t === "—" ? null : t;
}

function parseMoneyCents(v: string): number | null {
  const t = v.trim().replace(/[$,]/g, "");
  if (!t) return null;
  return dollarsToCents(t);
}

function parseEnum<T extends string>(v: string, allowed: readonly T[]): T | null {
  const t = v.trim();
  if (!t) return null;
  return (allowed as readonly string[]).includes(t) ? (t as T) : null;
}

function parseBool(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "true" || t === "1" || t === "yes" || t === "y";
}

export async function importBudgetCsv(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can import budgets" };

  const raw = String(fd.get("csv") ?? "").trim();
  if (!raw) return { error: "Paste CSV or TSV from the XPMS Budget tab." };

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { error: "Need at least a header row plus one data row." };

  // lines.length >= 2 checked above.
  const delimiter = detectDelimiter(lines[0]!);
  const headerCells = parseCsvLine(lines[0]!, delimiter).map((c) => c.trim().toLowerCase());
  const columnMap: (CanonicalKey | null)[] = headerCells.map((h) => HEADER_MAP[h] ?? null);

  // Project name → id resolution (cached per call).
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  const projectByName = new Map<string, string>();
  for (const p of (projects ?? []) as Array<{ id: string; name: string }>) {
    projectByName.set(p.name.toLowerCase(), p.id);
  }

  const inserts: Array<Record<string, unknown>> = [];
  const skipped: Array<{ row: number; reason: string }> = [];

  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li]!, delimiter);
    const get = (key: CanonicalKey): string => {
      const idx = columnMap.indexOf(key);
      return idx === -1 ? "" : (cells[idx] ?? "");
    };

    const description = nullable(get("description"));
    const item = nullable(get("item"));
    const name = description ?? item ?? `Row ${li + 1}`;

    // Project resolution
    let project_id: string | null = null;
    const projectCell = get("project").trim();
    if (projectCell) {
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      if (uuidRegex.test(projectCell)) {
        project_id = projectCell;
      } else {
        const resolved = projectByName.get(projectCell.toLowerCase());
        if (!resolved) {
          skipped.push({ row: li + 1, reason: `Project not found: "${projectCell}"` });
          continue;
        }
        project_id = resolved;
      }
    }

    const amount_cents = parseMoneyCents(get("amount"));
    if (amount_cents === null) {
      skipped.push({ row: li + 1, reason: "Missing or invalid BUDGET value" });
      continue;
    }

    const lineType = parseEnum(get("line_type"), XPMS_LINE_TYPES) ?? "Scope";

    inserts.push({
      org_id: session.orgId,
      project_id,
      name,
      amount_cents,
      committed_cents: parseMoneyCents(get("committed")),
      forecast_cents: parseMoneyCents(get("forecast")),
      actual_cents: parseMoneyCents(get("actual")),
      department: parseEnum(get("department"), XPMS_DEPARTMENTS),
      team: nullable(get("team")),
      class: nullable(get("class")),
      item: nullable(get("item")),
      discipline: parseEnum(get("discipline"), XPMS_DISCIPLINES),
      xpms_phase: parseEnum(get("xpms_phase"), XPMS_PHASES),
      tier: parseEnum(get("tier"), XPMS_TIERS),
      xyz: parseEnum(get("xyz"), XPMS_XYZ),
      line_type: lineType,
      quantity: get("quantity").trim() ? Number(get("quantity")) : null,
      rate_cents: parseMoneyCents(get("rate")),
      vendor: nullable(get("vendor")),
      budget_status: nullable(get("status")),
      flag: parseBool(get("flag")),
      event: nullable(get("event")),
      location: nullable(get("location")),
      activation: nullable(get("activation")),
      external_notes: nullable(get("external_notes")),
      internal_notes: nullable(get("internal_notes")),
    });
  }

  if (inserts.length === 0) {
    return { error: `Nothing imported. ${skipped.length} rows skipped.` };
  }

  const { error } = await (supabase as unknown as LooseSupabase).from("budgets").insert(inserts);
  if (error) return { error: error.message };

  revalidatePath("/studio/finance/budgets");
  revalidatePath("/studio/finance/budgets/summary");
  if (skipped.length === 0) {
    redirect("/studio/finance/budgets");
  }
  return { ok: true, inserted: inserts.length, skipped };
}
