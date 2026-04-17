// Discriminated union of every proposal block type.
// Synthesized from the F1 Miami demo's section surface and proposalzero's PHASES schema.

export type Money = { cents: number; currency?: string };
export type AccentColor = string;

export type ProposalBlock =
  | { type: "hero"; eyebrow?: string; title: string; subtitle?: string; partners?: string[]; narrative?: string; meta?: { label: string; value: string }[]; accent?: AccentColor }
  | { type: "section_eyebrow"; label: string; accent?: AccentColor }
  | { type: "heading"; level?: 2 | 3; text: string }
  | { type: "prose"; body: string }
  | { type: "callout"; kind: "pink" | "gold" | "teal" | "red"; title?: string; body: string }
  | { type: "overview_cards"; cards: { tag?: string; title: string; details: { label: string; value: string }[]; accent?: AccentColor }[] }
  | {
      type: "phase";
      id?: string;
      num: string | number;
      name: string;
      tag?: string;
      accent?: AccentColor;
      narrative?: string;
      core?: { name: string; desc?: string; price?: Money | string }[];
      addons?: { id: string; name: string; desc?: string; price?: Money | string }[];
      gate?: { title: string; items: string[]; unlocks?: string };
      contractRefs?: string[];
      coreInvestment?: Money;
    }
  | { type: "journey"; steps: { num: number; title: string; description?: string; status?: string; date?: string }[] }
  | { type: "schedule_table"; rows: { phase: string; milestone: string; date: string }[] }
  | { type: "capabilities"; cards: { title: string; body: string; accent?: AccentColor }[] }
  | {
      type: "investment_table";
      groups: { label: string; items: { name: string; desc?: string; price: Money | string }[] }[];
      total: Money;
      taxNote?: string;
    }
  | { type: "total_block"; label: string; amount: Money; note?: string; accent?: AccentColor }
  | { type: "engagement_split"; depositPercent: number; balancePercent: number; depositLabel?: string; balanceLabel?: string }
  | { type: "payment_method"; method: "ach" | "wire" | "check" | "quickbooks"; details: Record<string, string> }
  | {
      type: "equipment_manifest";
      items: { name: string; quantity: number; vendor?: string; url?: string; note?: string }[];
    }
  | { type: "change_orders"; items: { name: string; description: string; price?: Money | string }[] }
  | { type: "exclusions"; items: { term: string; body: string }[] }
  | { type: "terms_grid"; items: { section: string; title: string; body: string }[] }
  | { type: "legal_panel"; panels: { slug: string; label: string; body: string }[] }
  | { type: "signature_block"; parties: { role: string; name?: string; email?: string }[]; instructions?: string }
  | { type: "cta"; label: string; href: string; variant?: "primary" | "secondary" }
  | { type: "spacer"; size?: "sm" | "md" | "lg" }
  | { type: "custom"; body: string };

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
  "hero", "section_eyebrow", "heading", "prose", "callout",
  "overview_cards", "phase", "journey", "schedule_table", "capabilities",
  "investment_table", "total_block", "engagement_split", "payment_method",
  "equipment_manifest", "change_orders", "exclusions", "terms_grid",
  "legal_panel", "signature_block", "cta", "spacer", "custom",
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
