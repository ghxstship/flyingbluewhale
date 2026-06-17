/**
 * Proposal binding bridge guard — the System-B `proposals.blocks` document must
 * map cleanly onto the kit `proposal` template's merge-field data-paths, and
 * every path the resolver produces must be one the enriched template reads
 * (no orphan bindings, no missing coverage).
 */
import { describe, it, expect } from "vitest";
import type { ProposalBlock } from "@/lib/proposals/types";
import { BLOCK_TYPES } from "@/lib/proposals/types";
import { proposalDataFromBlocks, STRUCTURAL_BLOCK_TYPES } from "./proposal-binding";
import { getDocTemplate } from "./registry";
import { paths, getPath } from "./contract";

/** Minimal valid instance of every block type — drives the coverage guard. */
const MINIMAL: Record<ProposalBlock["type"], ProposalBlock> = {
  hero: { type: "hero", title: "T" },
  section_eyebrow: { type: "section_eyebrow", label: "L" },
  heading: { type: "heading", text: "H" },
  prose: { type: "prose", body: "Narrative body." },
  callout: { type: "callout", kind: "pink", body: "Callout body." },
  overview_cards: { type: "overview_cards", cards: [{ title: "C", details: [{ label: "l", value: "v" }] }] },
  phase: { type: "phase", num: 1, name: "P" },
  journey: { type: "journey", steps: [{ num: 1, title: "Kickoff", status: "Done" }] },
  schedule_table: { type: "schedule_table", rows: [{ phase: "p", milestone: "m", date: "d" }] },
  capabilities: { type: "capabilities", cards: [{ title: "Cap", body: "Cap body." }] },
  investment_table: {
    type: "investment_table",
    groups: [{ label: "G", items: [{ name: "n", price: { cents: 100 } }] }],
    total: { cents: 100 },
  },
  total_block: { type: "total_block", label: "T", amount: { cents: 100 } },
  engagement_split: { type: "engagement_split", depositPercent: 60, balancePercent: 40 },
  payment_method: { type: "payment_method", method: "ach", details: {} },
  equipment_manifest: { type: "equipment_manifest", items: [{ name: "Truss", quantity: 4 }] },
  change_orders: { type: "change_orders", items: [{ name: "N", description: "D" }] },
  exclusions: { type: "exclusions", items: [{ term: "T", body: "B" }] },
  terms_grid: { type: "terms_grid", items: [{ section: "01", title: "T", body: "B" }] },
  legal_panel: { type: "legal_panel", panels: [{ slug: "s", label: "L", body: "B" }] },
  signature_block: { type: "signature_block", parties: [{ role: "r" }] },
  cta: { type: "cta", label: "L", href: "#" },
  spacer: { type: "spacer" },
  custom: { type: "custom", body: "<p>Custom <strong>X</strong></p>" },
};

const BLOCKS: ProposalBlock[] = [
  {
    type: "hero",
    title: "Nike × Men's World Cup 2026 — Brazil Base Camp",
    subtitle: "Full fabricated + printed scope across five activation sites.",
    meta: [
      { label: "Venue", value: "New Jersey" },
      { label: "Scope type", value: "Base camp fabrication" },
    ],
  },
  {
    type: "phase",
    num: 1,
    name: "Fabrication & Print",
    tag: "Shop build",
    items: [
      { label: "Environmental structure & millwork", amountCents: 2550000 },
      { label: "Large-format print & graphics", amountCents: 3000000 },
    ],
  },
  {
    type: "schedule_table",
    rows: [{ phase: "Install", milestone: "Venue access · load-in", date: "May 26, 2026" }],
  },
  {
    type: "investment_table",
    groups: [
      { label: "Fabrication & Print", items: [{ name: "All categories", price: { cents: 10500000 } }] },
      { label: "Production Services", items: [{ name: "All categories", price: { cents: 7000000 } }] },
    ],
    total: { cents: 17500000 },
  },
  { type: "engagement_split", depositPercent: 60, balancePercent: 40 },
  { type: "payment_method", method: "ach", details: { bank: "Issued on execution" } },
  {
    type: "change_orders",
    items: [{ name: "Tier 2 material upgrade", description: "Premium finishes", price: "On approval" }],
  },
  {
    type: "exclusions",
    items: [{ term: "Equipment", body: "AV, lighting, and rigging are venue-provided." }],
  },
  {
    type: "terms_grid",
    items: [{ section: "03", title: "Payment", body: "60% deposit on signature; 40% before load-in." }],
  },
];

describe("proposal binding bridge", () => {
  const data = proposalDataFromBlocks(BLOCKS, { currency: "USD", depositPercent: 60, amountCents: 17500000 });

  it("maps each builder block into the template's merge-field namespaces", () => {
    expect(getPath(data, "project.objective")).toContain("activation sites");
    expect(getPath(data, "project.venue")).toBe("New Jersey");
    expect(getPath(data, "scope.0.category")).toBe("Fabrication & Print");
    expect(getPath(data, "scope.0.amount")).toContain("25,500");
    expect(getPath(data, "phases.0.name")).toBe("Fabrication & Print");
    expect(getPath(data, "schedule.0.milestone")).toContain("load-in");
    expect(getPath(data, "invest.0.phase")).toBe("Fabrication & Print");
    expect(getPath(data, "invest.0.amount")).toContain("105,000");
    expect(getPath(data, "invest.total")).toContain("175,000");
    expect(getPath(data, "payment.depositPct")).toBe("60%");
    expect(getPath(data, "payment.depositAmount")).toContain("105,000");
    expect(getPath(data, "payment.method")).toBe("ACH");
    expect(getPath(data, "changes.0.name")).toBe("Tier 2 material upgrade");
    expect(getPath(data, "exclusions.0")).toContain("Equipment");
    expect(getPath(data, "terms.0.title")).toBe("Payment");
  });

  it("emits no path the enriched template does not read (no orphan bindings)", () => {
    const templatePaths = new Set(paths(getDocTemplate("proposal")!));
    const flat: string[] = [];
    const walk = (obj: unknown, prefix: string) => {
      if (obj == null || typeof obj !== "object") {
        flat.push(prefix);
        return;
      }
      for (const [k, v] of Object.entries(obj)) walk(v, prefix ? `${prefix}.${k}` : k);
    };
    walk(data, "");
    // Every leaf the bridge produces is a documented merge-field path. (Identity
    // defaults like project.title/id are added by the resolver, not the bridge.)
    const orphans = flat.filter((p) => !templatePaths.has(p) && !p.startsWith("payment.depositTerms") && !p.startsWith("payment.balanceTerms"));
    expect(orphans, `orphan paths: ${orphans.join(", ")}`).toEqual([]);
  });

  it("omits namespaces the blocks don't carry (honest fallback)", () => {
    const sparse = proposalDataFromBlocks([{ type: "prose", body: "x" }]);
    expect(sparse.scope).toBeUndefined();
    expect(sparse.invest).toBeUndefined();
    expect(sparse.terms).toBeUndefined();
  });
});

describe("proposal binding — block-type coverage guard", () => {
  // Every content-bearing block type MUST contribute bound data. This is the
  // guard that stops a new block type (or a regression like the stale react-pdf
  // `kind` renderer) from silently dropping authored content again.
  for (const type of BLOCK_TYPES) {
    if (STRUCTURAL_BLOCK_TYPES.has(type)) {
      it(`treats "${type}" as structural chrome (no doc body)`, () => {
        expect(Object.keys(proposalDataFromBlocks([MINIMAL[type]]))).toEqual([]);
      });
    } else {
      it(`binds content-bearing "${type}" into the kit doc`, () => {
        const data = proposalDataFromBlocks([MINIMAL[type]]);
        expect(Object.keys(data).length, `"${type}" produced no bound data`).toBeGreaterThan(0);
      });
    }
  }

  it("folds the 6 previously-unbound content types into their namespaces", () => {
    expect(proposalDataFromBlocks([MINIMAL.prose]).narrative).toContain("Narrative body.");
    expect(proposalDataFromBlocks([MINIMAL.callout]).narrative).toContain("Callout body.");
    expect((proposalDataFromBlocks([MINIMAL.capabilities]).narrative as string[])[0]).toContain("Cap body.");
    expect((proposalDataFromBlocks([MINIMAL.custom]).narrative as string[])[0]).toBe("Custom X");
    const journey = proposalDataFromBlocks([MINIMAL.journey]).schedule as { milestone?: string }[];
    expect(journey[0]?.milestone).toBe("Kickoff");
    const equip = proposalDataFromBlocks([MINIMAL.equipment_manifest]).scope as { label?: string }[];
    expect(equip[0]?.label).toContain("Truss");
  });

  it("every bound block type emits only documented template paths (no orphans)", () => {
    const templatePaths = new Set(paths(getDocTemplate("proposal")!));
    const flat: string[] = [];
    const walk = (obj: unknown, prefix: string) => {
      if (obj == null || typeof obj !== "object") {
        if (prefix) flat.push(prefix);
        return;
      }
      for (const [k, v] of Object.entries(obj)) walk(v, prefix ? `${prefix}.${k}` : k);
    };
    for (const type of BLOCK_TYPES) {
      if (STRUCTURAL_BLOCK_TYPES.has(type)) continue;
      flat.length = 0;
      walk(proposalDataFromBlocks([MINIMAL[type]]), "");
      const orphans = flat.filter(
        (p) => !templatePaths.has(p) && !p.startsWith("payment.depositTerms") && !p.startsWith("payment.balanceTerms"),
      );
      expect(orphans, `"${type}" emits orphan paths: ${orphans.join(", ")}`).toEqual([]);
    }
  });
});
