import { z } from "zod";
import { CATALOG_KINDS } from "@/lib/db/assignments";
import type { ProposalBlock } from "./types";

// Boundary validator for proposals.blocks. Two callers:
//
//   1. The proposal editor save action (defensive — JSON authoring mode
//      lets ops paste arbitrary content, which then gets stored as
//      JSONB without further check).
//   2. The convert-to-project action (mandatory — the seeder walks the
//      tree assuming the schema below; without validation a single
//      malformed phase block would silently skip every downstream row).
//
// All schemas are `.passthrough()` so unknown / future fields don't
// cause regressions. Type discrimination uses the `type` literal — the
// underlying TS union in ./types.ts is the source of truth, this file
// mirrors it as a runtime check.

const Money = z.object({
  cents: z.number().int(),
  currency: z.string().optional(),
});
const MoneyOrString = z.union([Money, z.string()]);

const CatalogKind = z.enum(CATALOG_KINDS);

const DocDeliverableType = z.enum([
  "technical_rider",
  "hospitality_rider",
  "input_list",
  "stage_plot",
  "crew_list",
  "guest_list",
  "equipment_pull_list",
  "power_plan",
  "rigging_plan",
  "site_plan",
  "build_schedule",
  "vendor_package",
  "safety_compliance",
  "comms_plan",
  "signage_grid",
  "custom",
]);

// XPMS v08 8-Gate Lifecycle — mirrors public.xpms_phase (migration 20260605170000).
const XpmsPhaseKey = z.enum(["Discovery", "Design", "Advance", "Procurement", "Build", "Install", "Operate", "Close"]);

const PhaseDeliverable = z
  .object({
    id: z.string().optional(),
    label: z.string(),
    desc: z.string().optional(),
    deliverableType: DocDeliverableType.optional(),
    deadline: z.string().optional(),
  })
  .passthrough();

const LineItemBase = {
  id: z.string().optional(),
  desc: z.string().optional(),
  qty: z.number().optional(),
  unit: z.string().optional(),
  unitCostCents: z.number().int().optional(),
  catalogKind: CatalogKind.optional(),
  catalogCode: z.string().optional(),
  catalogItemId: z.string().uuid().optional(),
  budgetCategory: z.string().optional(),
};

// Investment-table item: legacy `name` + `price` shape with optional
// lineage extensions.
const InvestmentItem = z
  .object({
    name: z.string(),
    price: MoneyOrString,
    ...LineItemBase,
  })
  .passthrough();

const EquipmentItem = z
  .object({
    name: z.string(),
    quantity: z.number(),
    vendor: z.string().optional(),
    url: z.string().optional(),
    note: z.string().optional(),
    id: z.string().optional(),
    unitCostCents: z.number().int().optional(),
    catalogKind: CatalogKind.optional(),
    catalogCode: z.string().optional(),
    catalogItemId: z.string().uuid().optional(),
  })
  .passthrough();

const ChangeOrderItem = z
  .object({
    name: z.string(),
    description: z.string(),
    price: MoneyOrString.optional(),
    id: z.string().optional(),
    catalogKind: CatalogKind.optional(),
    catalogCode: z.string().optional(),
    budgetCategory: z.string().optional(),
  })
  .passthrough();

const Ids = {
  id: z.string().optional(),
  anchorId: z.string().optional(),
};

const Block = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("hero"),
      ...Ids,
      eyebrow: z.string().optional(),
      title: z.string(),
      subtitle: z.string().optional(),
      partners: z.array(z.string()).optional(),
      narrative: z.string().optional(),
      meta: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
      accent: z.string().optional(),
    })
    .passthrough(),
  z
    .object({ type: z.literal("section_eyebrow"), ...Ids, label: z.string(), accent: z.string().optional() })
    .passthrough(),
  z
    .object({
      type: z.literal("heading"),
      ...Ids,
      level: z.union([z.literal(2), z.literal(3)]).optional(),
      text: z.string(),
    })
    .passthrough(),
  z.object({ type: z.literal("prose"), ...Ids, body: z.string() }).passthrough(),
  z
    .object({
      type: z.literal("callout"),
      ...Ids,
      kind: z.enum(["pink", "gold", "teal", "red"]),
      title: z.string().optional(),
      body: z.string(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("overview_cards"),
      ...Ids,
      cards: z.array(
        z
          .object({
            tag: z.string().optional(),
            title: z.string(),
            details: z.array(z.object({ label: z.string(), value: z.string() })),
            accent: z.string().optional(),
          })
          .passthrough(),
      ),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("phase"),
      ...Ids,
      num: z.union([z.string(), z.number()]),
      name: z.string(),
      tag: z.string().optional(),
      accent: z.string().optional(),
      narrative: z.string().optional(),
      xpmsPhase: XpmsPhaseKey.optional(),
      deliverables: z.array(PhaseDeliverable).optional(),
      items: z
        .array(z.object({ label: z.string(), amountCents: z.number().int(), ...LineItemBase }).passthrough())
        .optional(),
      core: z
        .array(
          z.object({ name: z.string(), desc: z.string().optional(), price: MoneyOrString.optional() }).passthrough(),
        )
        .optional(),
      addons: z
        .array(
          z
            .object({ id: z.string(), name: z.string(), desc: z.string().optional(), price: MoneyOrString.optional() })
            .passthrough(),
        )
        .optional(),
      gate: z
        .object({ title: z.string(), items: z.array(z.string()), unlocks: z.string().optional() })
        .passthrough()
        .optional(),
      contractRefs: z.array(z.string()).optional(),
      coreInvestment: Money.optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("journey"),
      ...Ids,
      steps: z.array(
        z
          .object({
            num: z.number(),
            title: z.string(),
            description: z.string().optional(),
            status: z.string().optional(),
            date: z.string().optional(),
          })
          .passthrough(),
      ),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("schedule_table"),
      ...Ids,
      rows: z.array(z.object({ phase: z.string(), milestone: z.string(), date: z.string() }).passthrough()),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("capabilities"),
      ...Ids,
      cards: z.array(z.object({ title: z.string(), body: z.string(), accent: z.string().optional() }).passthrough()),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("investment_table"),
      ...Ids,
      groups: z.array(
        z
          .object({
            label: z.string(),
            budgetCategory: z.string().optional(),
            items: z.array(InvestmentItem),
          })
          .passthrough(),
      ),
      total: Money,
      taxNote: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("total_block"),
      ...Ids,
      label: z.string(),
      amount: Money,
      note: z.string().optional(),
      accent: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("engagement_split"),
      ...Ids,
      depositPercent: z.number(),
      balancePercent: z.number(),
      depositLabel: z.string().optional(),
      balanceLabel: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("payment_method"),
      ...Ids,
      method: z.enum(["ach", "wire", "check", "quickbooks"]),
      details: z.record(z.string(), z.string()),
    })
    .passthrough(),
  z.object({ type: z.literal("equipment_manifest"), ...Ids, items: z.array(EquipmentItem) }).passthrough(),
  z.object({ type: z.literal("change_orders"), ...Ids, items: z.array(ChangeOrderItem) }).passthrough(),
  z
    .object({
      type: z.literal("exclusions"),
      ...Ids,
      items: z.array(z.object({ term: z.string(), body: z.string() }).passthrough()),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("terms_grid"),
      ...Ids,
      items: z.array(z.object({ section: z.string(), title: z.string(), body: z.string() }).passthrough()),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("legal_panel"),
      ...Ids,
      panels: z.array(z.object({ slug: z.string(), label: z.string(), body: z.string() }).passthrough()),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("signature_block"),
      ...Ids,
      parties: z.array(
        z.object({ role: z.string(), name: z.string().optional(), email: z.string().optional() }).passthrough(),
      ),
      instructions: z.string().optional(),
    })
    .passthrough(),
  z
    .object({
      type: z.literal("cta"),
      ...Ids,
      label: z.string(),
      href: z.string(),
      variant: z.enum(["primary", "secondary"]).optional(),
    })
    .passthrough(),
  z.object({ type: z.literal("spacer"), ...Ids, size: z.enum(["sm", "md", "lg"]).optional() }).passthrough(),
  z.object({ type: z.literal("custom"), ...Ids, body: z.string() }).passthrough(),
]);

export const BlocksSchema = z.array(Block);

export type ValidateBlocksResult =
  | { ok: true; blocks: ProposalBlock[] }
  | { ok: false; error: string; issues: z.ZodIssue[] };

// Parse + cast. Callers should treat the success branch as the canonical
// shape; the `as` is safe because the discriminated-union schema above
// is structurally a subset of the TS union (with passthrough widening).
export function validateBlocks(input: unknown): ValidateBlocksResult {
  const parsed = BlocksSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, blocks: parsed.data as unknown as ProposalBlock[] };
  }
  const first = parsed.error.issues[0];
  const path = first?.path.join(".") ?? "(root)";
  return { ok: false, error: `blocks[${path}]: ${first?.message ?? "invalid"}`, issues: parsed.error.issues };
}

// Lenient variant for the seeder: returns whatever blocks parse cleanly
// and drops the rest. Used by convertProposalToProjectAction so a single
// malformed block doesn't abort the entire seed pass.
export function partitionBlocks(input: unknown): { valid: ProposalBlock[]; invalid: number } {
  if (!Array.isArray(input)) return { valid: [], invalid: 0 };
  let invalid = 0;
  const valid: ProposalBlock[] = [];
  for (const raw of input) {
    const parsed = Block.safeParse(raw);
    if (parsed.success) valid.push(parsed.data as unknown as ProposalBlock);
    else invalid += 1;
  }
  return { valid, invalid };
}
