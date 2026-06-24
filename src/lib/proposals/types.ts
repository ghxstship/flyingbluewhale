// Re-derive CatalogKind from the canonical tuple in `@/lib/db/assignments`
// (the single authoring site, mirroring public.catalog_kind). TYPE-ONLY
// import so no `server-only` runtime code reaches client bundles.
import type { CatalogKind } from "@/lib/db/assignments";
export type { CatalogKind };

// Discriminated union of every proposal block type.
// Synthesized from the F1 Miami demo's section surface and proposalzero's PHASES schema.
//
// SEEDING CONVENTION (2026-06-03): the optional `id`, `anchorId`,
// `xpmsPhase`, `catalogKind`, `catalogCode`, `catalogItemId`,
// `budgetCategory`, and `deliverableType` fields are *lineage hints*
// the convert-to-project seeder uses to materialise downstream rows:
//
//   phase blocks       → public.deliverables (one per PhaseDeliverable
//                        with a deliverableType) and
//                        public.master_catalog_items (upserted per
//                        LineItem with a catalogKind+catalogCode).
//   investment_table   → public.budgets (one row per group, category =
//                        group.budgetCategory ?? group.label).
//
// All hint fields are optional — pre-existing proposals without them
// still render and convert; they just don't auto-materialise the
// catalog/deliverable/budget rows.

export type Money = { cents: number; currency?: string };
export type AccentColor = string;

// Document-class deliverables only (riders, plots, lists, plans, grids).
// Per-individual entitlements live in public.assignments via
// catalog_item_id and use the CatalogKind taxonomy above; the post-0066
// deliverable_type enum no longer carries the *_assignment values.
export type DocDeliverableType =
  | "technical_rider"
  | "hospitality_rider"
  | "input_list"
  | "stage_plot"
  | "crew_list"
  | "guest_list"
  | "equipment_pull_list"
  | "power_plan"
  | "rigging_plan"
  | "site_plan"
  | "build_schedule"
  | "vendor_package"
  | "safety_compliance"
  | "comms_plan"
  | "signage_grid"
  | "custom";

// Mirrors public.xpms_phase — the XPMS v08 8-Gate Lifecycle (migration
// 20260605170000). Phase blocks may declare which point on the project
// lifecycle they correspond to so workback-schedule seeding stays aligned
// with the project's `xpms_phase` cursor.
export type XpmsPhaseKey =
  | "Discovery"
  | "Design"
  | "Advance"
  | "Procurement"
  | "Build"
  | "Install"
  | "Operate"
  | "Close";

// Canonical line-item shape used by investment_table, equipment_manifest,
// change_orders, and the new phase.items[] field. Free-form
// `{name, price}` legacy items still work — their `name` is the label
// and `price.cents` becomes amountCents; the optional fields just gate
// what auto-seeds.
export type LineItem = {
  id?: string;
  label: string;
  desc?: string;
  qty?: number;
  unit?: string;
  unitCostCents?: number;
  amountCents: number;
  catalogKind?: CatalogKind;
  /** master_catalog_items.code on upsert. Unique per (org_id, code). */
  catalogCode?: string;
  /** Pre-existing master_catalog_items.id when authored against the catalog. */
  catalogItemId?: string;
  budgetCategory?: string;
};

// One row per Production Lifecycle deliverable on a phase block.
// `deliverableType` makes the row materialise in public.deliverables on
// proposal conversion; without it the deliverable renders in the proposal
// but doesn't seed.
export type PhaseDeliverable = {
  id?: string;
  label: string;
  desc?: string;
  deliverableType?: DocDeliverableType;
  /** ISO date — copied to deliverables.deadline on seed. */
  deadline?: string;
};

// Universal block-level identifiers. `id` is a stable nanoid for diffing
// across versions; `anchorId` is the canonical 17-section slot
// (`hero`, `scope-of-work`, `production-lifecycle`, etc.) so seeders
// and cross-references survive reorder.
type BlockIds = { id?: string; anchorId?: string };

export type ProposalBlock =
  | (BlockIds & {
      type: "hero";
      eyebrow?: string;
      title: string;
      subtitle?: string;
      partners?: string[];
      narrative?: string;
      meta?: { label: string; value: string }[];
      accent?: AccentColor;
    })
  | (BlockIds & { type: "section_eyebrow"; label: string; accent?: AccentColor })
  | (BlockIds & { type: "heading"; level?: 2 | 3; text: string })
  | (BlockIds & { type: "prose"; body: string })
  | (BlockIds & { type: "callout"; kind: "pink" | "gold" | "teal" | "red"; title?: string; body: string })
  | (BlockIds & {
      type: "overview_cards";
      cards: { tag?: string; title: string; details: { label: string; value: string }[]; accent?: AccentColor }[];
    })
  | (BlockIds & {
      type: "phase";
      num: string | number;
      name: string;
      tag?: string;
      accent?: AccentColor;
      narrative?: string;
      /** Optional explicit lifecycle slot; defaults to the phase block's ordinal. */
      xpmsPhase?: XpmsPhaseKey;
      /** Canonical structured deliverables — seeds into public.deliverables. */
      deliverables?: PhaseDeliverable[];
      /** Canonical structured line items — seeds into master_catalog_items. */
      items?: LineItem[];
      /** Legacy free-form core scope items (kept for back-compat). */
      core?: { name: string; desc?: string; price?: Money | string }[];
      /** Legacy free-form add-ons (kept for back-compat). */
      addons?: { id: string; name: string; desc?: string; price?: Money | string }[];
      gate?: { title: string; items: string[]; unlocks?: string };
      contractRefs?: string[];
      coreInvestment?: Money;
    })
  | (BlockIds & {
      type: "journey";
      steps: { num: number; title: string; description?: string; status?: string; date?: string }[];
    })
  | (BlockIds & { type: "schedule_table"; rows: { phase: string; milestone: string; date: string }[] })
  | (BlockIds & { type: "capabilities"; cards: { title: string; body: string; accent?: AccentColor }[] })
  | (BlockIds & {
      type: "investment_table";
      groups: {
        label: string;
        /** Drives the budgets seed; defaults to `label`. */
        budgetCategory?: string;
        items: {
          name: string;
          desc?: string;
          price: Money | string;
          // Lineage extensions — all optional:
          id?: string;
          qty?: number;
          unit?: string;
          unitCostCents?: number;
          catalogKind?: CatalogKind;
          catalogCode?: string;
          catalogItemId?: string;
        }[];
      }[];
      total: Money;
      taxNote?: string;
    })
  | (BlockIds & { type: "total_block"; label: string; amount: Money; note?: string; accent?: AccentColor })
  | (BlockIds & {
      type: "engagement_split";
      depositPercent: number;
      balancePercent: number;
      depositLabel?: string;
      balanceLabel?: string;
    })
  | (BlockIds & {
      type: "payment_method";
      method: "ach" | "wire" | "check" | "quickbooks";
      details: Record<string, string>;
    })
  | (BlockIds & {
      type: "equipment_manifest";
      items: {
        name: string;
        quantity: number;
        vendor?: string;
        url?: string;
        note?: string;
        // Lineage extensions:
        id?: string;
        unitCostCents?: number;
        catalogKind?: CatalogKind;
        catalogCode?: string;
        catalogItemId?: string;
      }[];
    })
  | (BlockIds & {
      type: "change_orders";
      items: {
        name: string;
        description: string;
        price?: Money | string;
        // Lineage extensions:
        id?: string;
        catalogKind?: CatalogKind;
        catalogCode?: string;
        budgetCategory?: string;
      }[];
    })
  | (BlockIds & { type: "exclusions"; items: { term: string; body: string }[] })
  | (BlockIds & { type: "terms_grid"; items: { section: string; title: string; body: string }[] })
  | (BlockIds & { type: "legal_panel"; panels: { slug: string; label: string; body: string }[] })
  | (BlockIds & {
      type: "signature_block";
      parties: { role: string; name?: string; email?: string }[];
      instructions?: string;
    })
  | (BlockIds & { type: "cta"; label: string; href: string; variant?: "primary" | "secondary" })
  | (BlockIds & { type: "spacer"; size?: "sm" | "md" | "lg" })
  | (BlockIds & { type: "custom"; body: string });

export type ProposalDoc = {
  id: string;
  title: string;
  doc_number?: string;
  version: number;
  theme: { primary: string; secondary: string };
  blocks: ProposalBlock[];
  currency: string;
  deposit_percent: number;
};

export type ProposalBlockType = ProposalBlock["type"];

export const BLOCK_TYPES: ProposalBlockType[] = [
  "hero",
  "section_eyebrow",
  "heading",
  "prose",
  "callout",
  "overview_cards",
  "phase",
  "journey",
  "schedule_table",
  "capabilities",
  "investment_table",
  "total_block",
  "engagement_split",
  "payment_method",
  "equipment_manifest",
  "change_orders",
  "exclusions",
  "terms_grid",
  "legal_panel",
  "signature_block",
  "cta",
  "spacer",
  "custom",
];

export const BLOCK_LABELS: Record<ProposalBlockType, string> = {
  hero: "Hero",
  section_eyebrow: "Section eyebrow",
  heading: "Heading",
  prose: "Prose paragraph",
  callout: "Callout",
  overview_cards: "Overview cards",
  phase: "Phase (scope accordion)",
  journey: "Journey steps",
  schedule_table: "Schedule table",
  capabilities: "Capabilities cards",
  investment_table: "Investment line items",
  total_block: "Total block",
  engagement_split: "Engagement split (deposit/balance)",
  payment_method: "Payment method",
  equipment_manifest: "Equipment manifest",
  change_orders: "Change orders",
  exclusions: "Exclusions",
  terms_grid: "Terms grid",
  legal_panel: "Legal panels",
  signature_block: "Signature block",
  cta: "Call to action",
  spacer: "Spacer",
  custom: "Custom HTML",
};

// Canonical 17 sections from reference_proposal_template.md, used as
// stable anchor slot keys. A block's `anchorId` should match one of
// these when it occupies a canonical slot — the seeder doesn't read
// this field, but cross-references (CTA hrefs, sticky nav, schedule
// tables that reference phase blocks) do.
export const CANONICAL_SECTIONS = [
  "sticky-nav",
  "hero",
  "brand-narrative",
  "project-overview",
  "scope-of-work",
  "activation-sites",
  "production-lifecycle",
  "workback-schedule",
  "investment-summary",
  "engagement-bar",
  "payment-method",
  "change-orders",
  "exclusions",
  "terms",
  "authorization",
  "cta-row",
  "footer",
] as const;
export type CanonicalSection = (typeof CANONICAL_SECTIONS)[number];
