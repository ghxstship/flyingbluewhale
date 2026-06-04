import "server-only";

import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import { partitionBlocks } from "./validate";
import type { CatalogKind, DocDeliverableType, LineItem, ProposalBlock } from "./types";

// Seed downstream rows from a proposal's blocks JSONB. Runs after the
// project row exists; each step soft-fails so a partial seed never
// rolls back the project — operators can finish by hand if a step
// errors. All steps are idempotent against the (project_id) scope:
// the action short-circuits if any deliverables already exist for the
// project, on the assumption that prior conversion runs (or hand
// authoring) already established the downstream state.

export type SeedFromBlocksInput = {
  orgId: string;
  projectId: string;
  blocks: unknown;
  doc_number?: string | null;
};

export type SeedFromBlocksResult = {
  deliverables: number;
  catalog: number;
  budgets: number;
  invalidBlocks: number;
  skipped?: "already_seeded";
};

const slugifyCode = (s: string) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

const priceToCents = (p: unknown): number | null => {
  if (!p) return null;
  if (typeof p === "object" && p !== null && "cents" in p && typeof (p as { cents: unknown }).cents === "number") {
    return (p as { cents: number }).cents;
  }
  if (typeof p === "string") {
    const n = Number.parseFloat(p.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  }
  return null;
};

export async function seedFromBlocks(input: SeedFromBlocksInput): Promise<SeedFromBlocksResult> {
  const { orgId, projectId, doc_number } = input;
  const supabase = await createClient();

  // Idempotency gate: if the project already has deliverables (from a
  // prior seed run or hand-authoring), skip entirely. Re-seeding would
  // duplicate placeholder rows the operator already curated.
  const { count: existingDeliverables } = await supabase
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .is("deleted_at", null);
  if ((existingDeliverables ?? 0) > 0) {
    return { deliverables: 0, catalog: 0, budgets: 0, invalidBlocks: 0, skipped: "already_seeded" };
  }

  const { valid, invalid } = partitionBlocks(input.blocks);
  let deliverableCount = 0;
  let catalogCount = 0;
  let budgetCount = 0;

  // ============================================================
  // 1. Phase blocks → deliverables + master_catalog_items
  // ============================================================
  const phaseBlocks = valid.filter((b): b is Extract<ProposalBlock, { type: "phase" }> => b.type === "phase");

  type DeliverableInsert = {
    org_id: string;
    project_id: string;
    type: DocDeliverableType;
    title: string;
    fulfillment_state: "briefed";
    deadline: string | null;
  };
  const deliverableRows: DeliverableInsert[] = [];

  type CatalogUpsert = {
    org_id: string;
    kind: CatalogKind;
    code: string;
    name: string;
    description: string | null;
    unit_cost_cents: number | null;
    currency: string;
  };
  const catalogRows: CatalogUpsert[] = [];
  // De-dupe within the same seed batch — multiple phase blocks may
  // reference the same SKU; the DB UNIQUE (org_id, code) would 23505
  // on the second insert and we'd lose every following row in the
  // same batch.
  const seenCatalogCodes = new Set<string>();

  for (const phase of phaseBlocks) {
    if (phase.deliverables) {
      for (const d of phase.deliverables) {
        if (!d.deliverableType) continue;
        deliverableRows.push({
          org_id: orgId,
          project_id: projectId,
          type: d.deliverableType,
          title: d.label,
          fulfillment_state: "briefed",
          deadline: d.deadline ?? null,
        });
      }
    }
    if (phase.items) {
      for (const item of phase.items as LineItem[]) {
        if (!item.catalogKind || !item.catalogCode) continue;
        const code = slugifyCode(item.catalogCode);
        if (!code || seenCatalogCodes.has(code)) continue;
        seenCatalogCodes.add(code);
        catalogRows.push({
          org_id: orgId,
          kind: item.catalogKind,
          code,
          name: item.label,
          description: item.desc ?? null,
          unit_cost_cents: item.unitCostCents ?? null,
          currency: "USD",
        });
      }
    }
  }

  if (catalogRows.length > 0) {
    // ON CONFLICT DO NOTHING via upsert. The UNIQUE constraint on
    // (org_id, code) catches the case where the operator pre-authored
    // the catalog row by hand.
    const { error, count } = await supabase
      .from("master_catalog_items")
      .upsert(catalogRows, { onConflict: "org_id,code", ignoreDuplicates: true, count: "exact" });
    if (error) {
      log.warn("seed_from_blocks.catalog_failed", { projectId, doc_number, err: error.message });
    } else {
      catalogCount = count ?? catalogRows.length;
    }
  }

  if (deliverableRows.length > 0) {
    const { error, count } = await supabase.from("deliverables").insert(deliverableRows, { count: "exact" });
    if (error) {
      log.warn("seed_from_blocks.deliverables_failed", { projectId, doc_number, err: error.message });
    } else {
      deliverableCount = count ?? deliverableRows.length;
    }
  }

  // ============================================================
  // 2. Investment tables → budgets (one row per group)
  // ============================================================
  const investmentBlocks = valid.filter(
    (b): b is Extract<ProposalBlock, { type: "investment_table" }> => b.type === "investment_table",
  );

  // XPMS classes (migration 0070). When the proposal's category text
  // matches one of these (case-insensitive), the seed populates the
  // typed `department` enum so the row participates in XPMS rollups
  // from day one. Otherwise department stays null and operators can
  // backfill via the edit form.
  const XPMS_DEPARTMENTS = new Set([
    "executive",
    "creative",
    "talent",
    "marketing",
    "build",
    "production",
    "operations",
    "experience",
    "hospitality",
    "technology",
  ]);

  type BudgetInsert = {
    org_id: string;
    project_id: string;
    name: string;
    category: string;
    department: string | null;
    line_type: "Scope" | "Fee" | "Contingency" | "Allowance" | "Markup";
    amount_cents: number;
  };
  const budgetRows: BudgetInsert[] = [];
  // budgets has no unique constraint on (project_id, category) so we
  // need to dedupe inside the batch ourselves.
  const seenBudgetKeys = new Set<string>();

  for (const inv of investmentBlocks) {
    for (const group of inv.groups) {
      const groupTotalCents = group.items.reduce((sum, item) => {
        const cents = priceToCents(item.price);
        return sum + (cents ?? 0);
      }, 0);
      const category = group.budgetCategory ?? group.label;
      const key = `${category}::${group.label}`;
      if (seenBudgetKeys.has(key)) continue;
      seenBudgetKeys.add(key);
      // Map category → XPMS department when the text matches an XPMS
      // class. The original casing of the canonical label is
      // preserved on the way in (the enum column requires exact case).
      const norm = category.toLowerCase();
      const department = XPMS_DEPARTMENTS.has(norm) ? norm.charAt(0).toUpperCase() + norm.slice(1) : null;
      budgetRows.push({
        org_id: orgId,
        project_id: projectId,
        name: group.label,
        category,
        department,
        line_type: "Scope",
        amount_cents: groupTotalCents,
      });
    }
  }

  if (budgetRows.length > 0) {
    const { error, count } = await supabase.from("budgets").insert(budgetRows, { count: "exact" });
    if (error) {
      log.warn("seed_from_blocks.budgets_failed", { projectId, doc_number, err: error.message });
    } else {
      budgetCount = count ?? budgetRows.length;
    }
  }

  return {
    deliverables: deliverableCount,
    catalog: catalogCount,
    budgets: budgetCount,
    invalidBlocks: invalid,
  };
}
