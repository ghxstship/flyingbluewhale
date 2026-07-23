"use client";

import { useActionState, useMemo, useState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Trash2, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { SortableList } from "@/components/ui/SortableList";
import { useT } from "@/lib/i18n/LocaleProvider";
import { PROPOSAL_DEPOSIT_PCT_DEFAULT, PROPOSAL_BALANCE_PCT_DEFAULT } from "@/lib/payment-terms";
import { BLOCK_LABELS, BLOCK_TYPES, type ProposalBlock, type ProposalBlockType } from "@/lib/proposals/types";
import { saveProposalAction, type EditState } from "./actions";
import { LineagePanel, isLineageBlock } from "./LineagePanel";
import { ProposalBrandPanel } from "./ProposalBrandPanel";

import { useActionErrorResolver } from "@/lib/errors-client";
// Give each block a stable id for sortable purposes.
type IdentifiedBlock = ProposalBlock & { _dragId: string };
let counter = 0;
const tagId = () => `blk-${Date.now()}-${++counter}`;

const BLOCK_DEFAULTS: Record<ProposalBlockType, ProposalBlock> = {
  hero: { type: "hero", eyebrow: "Proposal", title: "New Proposal", subtitle: "A short subtitle" },
  section_eyebrow: { type: "section_eyebrow", label: "Section label" },
  heading: { type: "heading", level: 2, text: "Heading" },
  prose: { type: "prose", body: "A paragraph of prose describing the context, approach, or rationale." },
  callout: { type: "callout", kind: "pink", title: "Note", body: "An important callout." },
  overview_cards: {
    type: "overview_cards",
    cards: [{ tag: "Phase 1", title: "Discovery", details: [{ label: "Duration", value: "2 weeks" }] }],
  },
  phase: {
    type: "phase",
    num: 1,
    name: "Phase one",
    narrative: "What happens here.",
    core: [{ name: "Core deliverable", price: { cents: 500000 } }],
    addons: [{ id: "a1", name: "Optional add-on", price: { cents: 100000 } }],
    gate: { title: "Gate", items: ["Client approval"], unlocks: "Phase two" },
    contractRefs: ["S2", "S6"],
  },
  journey: { type: "journey", steps: [{ num: 1, title: "Kickoff", description: "Workshop to align on goals." }] },
  schedule_table: { type: "schedule_table", rows: [{ phase: "Phase 1", milestone: "Kickoff", date: "TBD" }] },
  capabilities: { type: "capabilities", cards: [{ title: "Why us", body: "We ship." }] },
  investment_table: {
    type: "investment_table",
    groups: [{ label: "Production", items: [{ name: "Creative direction", price: { cents: 1200000 } }] }],
    total: { cents: 1200000 },
    taxNote: "Plus applicable taxes",
  },
  total_block: { type: "total_block", label: "Total investment", amount: { cents: 1200000 } },
  engagement_split: {
    type: "engagement_split",
    depositPercent: PROPOSAL_DEPOSIT_PCT_DEFAULT,
    balancePercent: PROPOSAL_BALANCE_PCT_DEFAULT,
  },
  payment_method: {
    type: "payment_method",
    method: "ach",
    details: { Beneficiary: "Your Company LLC", Routing: "wire on request", Account: "wire on request" },
  },
  equipment_manifest: {
    type: "equipment_manifest",
    items: [{ name: "Pioneer DJM-A9", quantity: 1, vendor: "Pioneer DJ" }],
  },
  change_orders: {
    type: "change_orders",
    items: [{ name: "Extended rehearsal", description: "Add a day of rehearsal.", price: { cents: 500000 } }],
  },
  exclusions: {
    type: "exclusions",
    items: [{ term: "Travel", body: "Travel and lodging are billed at cost with receipts." }],
  },
  terms_grid: {
    type: "terms_grid",
    items: [{ section: "S1", title: "Scope", body: "Scope as set forth in this proposal." }],
  },
  legal_panel: {
    type: "legal_panel",
    panels: [
      {
        slug: "msa",
        label: "Master Services Agreement",
        body: "MSA placeholder. Replace with full text or a signed link.",
      },
    ],
  },
  signature_block: {
    type: "signature_block",
    parties: [{ role: "Client" }, { role: "Producer", name: "ATLVS Technologies" }],
    instructions: "Sign below to accept this proposal.",
  },
  cta: { type: "cta", label: "Accept proposal", href: "#authorize", variant: "primary" },
  spacer: { type: "spacer", size: "md" },
  custom: { type: "custom", body: "<p>Custom HTML</p>" },
};

export function ProposalEditor({
  proposalId,
  defaults,
}: {
  proposalId: string;
  defaults: {
    title: string;
    doc_number: string;
    currency: string;
    deposit_percent: number;
    theme: { primary: string; secondary: string };
    blocks: unknown[];
  };
}) {
  const t = useT();
  const [blocks, setBlocks] = useState<IdentifiedBlock[]>(() =>
    (defaults.blocks as ProposalBlock[]).map((b) => ({ ...b, _dragId: tagId() })),
  );
  const serializeBlocks = (bs: IdentifiedBlock[]) => bs.map(({ _dragId: _ignored, ...rest }) => rest as ProposalBlock);
  const [json, setJson] = useState<string>(() => JSON.stringify(serializeBlocks(blocks), null, 2));
  const [mode, setMode] = useState<"outline" | "json">("outline");

  const resolveErr = useActionErrorResolver();
  const [state, formAction, pending] = useActionState<EditState, FormData>(async (prev, fd) => {
    fd.set("blocks", mode === "json" ? json : JSON.stringify(serializeBlocks(blocks)));
    const res = await saveProposalAction(proposalId, prev, fd);
    if (res?.error) toast.error(resolveErr(res.error));
    else if (res?.ok) toast.success(t("console.proposals.edit.savedToast", undefined, "Proposal saved · v bumped"));
    return res;
  }, null);

  const addBlock = (type: ProposalBlockType) => {
    setBlocks((b) => {
      const next: IdentifiedBlock[] = [...b, { ...BLOCK_DEFAULTS[type], _dragId: tagId() }];
      setJson(JSON.stringify(serializeBlocks(next), null, 2));
      return next;
    });
  };

  const removeBlock = (id: string) => {
    setBlocks((b) => {
      const next = b.filter((x) => x._dragId !== id);
      setJson(JSON.stringify(serializeBlocks(next), null, 2));
      return next;
    });
  };

  const updateBlock = (id: string, patch: ProposalBlock) => {
    setBlocks((b) => {
      const next: IdentifiedBlock[] = b.map((x) => (x._dragId === id ? { ...patch, _dragId: x._dragId } : x));
      setJson(JSON.stringify(serializeBlocks(next), null, 2));
      return next;
    });
  };

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const summary = useMemo(
    () => ({
      count: blocks.length,
      types: [...new Set(blocks.map((b) => b.type))].sort(),
    }),
    [blocks],
  );

  return (
    <form action={formAction} className="surface space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label={t("console.proposals.edit.fields.title", undefined, "Title")}
          name="title"
          required
          defaultValue={defaults.title}
        />
        <Input
          label={t("console.proposals.edit.fields.docNumber", undefined, "Doc #")}
          name="doc_number"
          defaultValue={defaults.doc_number}
          placeholder="FBW-001"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="currency" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.proposals.edit.fields.currency", undefined, "Currency")}
            </label>
            <select id="currency" name="currency" defaultValue={defaults.currency} className="ps-input mt-1.5 w-full">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
            </select>
          </div>
          <Input
            label={t("console.proposals.edit.fields.depositPercent", undefined, "Deposit %")}
            name="deposit_percent"
            type="number"
            min="0"
            max="100"
            defaultValue={defaults.deposit_percent}
          />
        </div>
      </div>
      <ProposalBrandPanel initialPrimary={defaults.theme.primary} initialSecondary={defaults.theme.secondary} />

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.proposals.edit.summary",
            { count: summary.count, types: summary.types.length },
            `${summary.count} blocks · ${summary.types.length} distinct types`,
          )}
        </div>
        <div className="inline-flex rounded-full border border-[var(--p-border)] bg-[var(--p-surface)] p-0.5">
          <button
            type="button"
            onClick={() => {
              setBlocks(JSON.parse(json));
              setMode("outline");
            }}
            className={`rounded-full px-3 py-1 text-xs ${mode === "outline" ? "bg-[var(--p-bg)]" : "text-[var(--p-text-2)]"}`}
          >
            {t("console.proposals.edit.mode.outline", undefined, "Outline")}
          </button>
          <button
            type="button"
            onClick={() => {
              setJson(JSON.stringify(blocks, null, 2));
              setMode("json");
            }}
            className={`rounded-full px-3 py-1 text-xs ${mode === "json" ? "bg-[var(--p-bg)]" : "text-[var(--p-text-2)]"}`}
          >
            {t("console.proposals.edit.mode.json", undefined, "JSON")}
          </button>
        </div>
      </div>

      {mode === "outline" ? (
        <div className="space-y-2">
          <SortableList
            items={blocks.map((b) => ({ id: b._dragId, block: b }))}
            onReorder={(items) => {
              const next = items.map((i) => i.block);
              setBlocks(next);
              setJson(JSON.stringify(serializeBlocks(next), null, 2));
            }}
            renderItem={(item, i) => {
              const lineage = isLineageBlock(item.block.type);
              const isOpen = expanded.has(item.block._dragId);
              return (
                <div className="surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
                        {i + 1} · {BLOCK_LABELS[item.block.type]}
                      </div>
                      <div className="mt-0.5 truncate text-sm">{describeBlock(item.block, t)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {lineage && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.block._dragId)}
                          className="ps-btn ps-btn--ghost ps-btn--sm"
                          aria-label={
                            isOpen
                              ? t("console.proposals.edit.lineage.collapse", undefined, "Collapse lineage")
                              : t("console.proposals.edit.lineage.edit", undefined, "Edit lineage")
                          }
                        >
                          <ChevronRight size={14} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                          <span className="ms-1 text-xs">
                            {t("console.proposals.edit.lineage.label", undefined, "Lineage")}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBlock(item.block._dragId)}
                        className="ps-btn ps-btn--ghost ps-btn--sm text-[var(--p-danger)]"
                        aria-label={t("common.remove", undefined, "Remove")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {lineage && isOpen && (
                    <LineagePanel block={item.block} onChange={(next) => updateBlock(item.block._dragId, next)} />
                  )}
                </div>
              );
            }}
          />

          <div className="surface-inset p-3">
            <div className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.proposals.edit.addBlock", undefined, "Add block")}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {BLOCK_TYPES.map((blockType) => (
                <button
                  key={blockType}
                  type="button"
                  onClick={() => addBlock(blockType)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--p-border)] px-2.5 py-1 text-xs hover:bg-[var(--p-surface)]"
                >
                  <Plus size={10} /> {BLOCK_LABELS[blockType]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="proposal-blocks-json" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.proposals.edit.blocksJson", undefined, "Blocks JSON")}
          </label>
          <textarea
            id="proposal-blocks-json"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={24}
            spellCheck={false}
            className="ps-input mt-1.5 w-full font-mono text-xs"
          />
        </div>
      )}

      {state?.error && <Alert kind="error">{resolveErr(state.error)}</Alert>}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? t("common.saving", undefined, "Saving…")
            : t("console.proposals.edit.save", undefined, "Save proposal")}
        </Button>
      </div>
    </form>
  );
}

function describeBlock(b: ProposalBlock, t: ReturnType<typeof useT>): string {
  switch (b.type) {
    case "hero":
      return b.title;
    case "section_eyebrow":
      return b.label;
    case "heading":
      return b.text;
    case "prose":
      return b.body.slice(0, 80);
    case "callout":
      return b.title ?? b.body.slice(0, 60);
    case "phase":
      return `${b.num}. ${b.name}`;
    case "investment_table": {
      const count = b.groups.reduce((s, g) => s + g.items.length, 0);
      return t("console.proposals.edit.describe.lineItems", { count }, `${count} line items`);
    }
    case "total_block":
      return b.label;
    case "engagement_split":
      return `${b.depositPercent}% / ${b.balancePercent}%`;
    case "signature_block":
      return t("console.proposals.edit.describe.signers", { count: b.parties.length }, `${b.parties.length} signer(s)`);
    case "legal_panel":
      return t("console.proposals.edit.describe.panels", { count: b.panels.length }, `${b.panels.length} panel(s)`);
    case "exclusions":
      return t("console.proposals.edit.describe.exclusions", { count: b.items.length }, `${b.items.length} exclusions`);
    case "equipment_manifest":
      return t("console.proposals.edit.describe.items", { count: b.items.length }, `${b.items.length} items`);
    case "terms_grid":
      return t("console.proposals.edit.describe.terms", { count: b.items.length }, `${b.items.length} terms`);
    default:
      return "";
  }
}
