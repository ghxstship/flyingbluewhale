"use client";

import { useActionState, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BLOCK_LABELS, BLOCK_TYPES, type ProposalBlock, type ProposalBlockType } from "@/lib/proposals/types";
import { saveProposalAction, type EditState } from "./actions";

const BLOCK_DEFAULTS: Record<ProposalBlockType, ProposalBlock> = {
  hero: { type: "hero", eyebrow: "Proposal", title: "New proposal", subtitle: "A short subtitle" },
  section_eyebrow: { type: "section_eyebrow", label: "Section label" },
  heading: { type: "heading", level: 2, text: "Heading" },
  prose: { type: "prose", body: "A paragraph of prose describing the context, approach, or rationale." },
  callout: { type: "callout", kind: "pink", title: "Note", body: "An important callout." },
  overview_cards: { type: "overview_cards", cards: [{ tag: "Phase 1", title: "Discovery", details: [{ label: "Duration", value: "2 weeks" }] }] },
  phase: { type: "phase", num: 1, name: "Phase one", narrative: "What happens here.", core: [{ name: "Core deliverable", price: { cents: 500000 } }], addons: [{ id: "a1", name: "Optional add-on", price: { cents: 100000 } }], gate: { title: "Gate", items: ["Client approval"], unlocks: "Phase two" }, contractRefs: ["S2","S6"] },
  journey: { type: "journey", steps: [{ num: 1, title: "Kickoff", description: "Workshop to align on goals." }] },
  schedule_table: { type: "schedule_table", rows: [{ phase: "Phase 1", milestone: "Kickoff", date: "TBD" }] },
  capabilities: { type: "capabilities", cards: [{ title: "Why us", body: "We ship." }] },
  investment_table: { type: "investment_table", groups: [{ label: "Production", items: [{ name: "Creative direction", price: { cents: 1200000 } }] }], total: { cents: 1200000 }, taxNote: "Plus applicable taxes" },
  total_block: { type: "total_block", label: "Total investment", amount: { cents: 1200000 } },
  engagement_split: { type: "engagement_split", depositPercent: 25, balancePercent: 75 },
  payment_method: { type: "payment_method", method: "ach", details: { "Beneficiary": "Your Company LLC", "Routing": "— wire on request", "Account": "— wire on request" } },
  equipment_manifest: { type: "equipment_manifest", items: [{ name: "Pioneer DJM-A9", quantity: 1, vendor: "Pioneer DJ" }] },
  change_orders: { type: "change_orders", items: [{ name: "Extended rehearsal", description: "Add a day of rehearsal.", price: { cents: 500000 } }] },
  exclusions: { type: "exclusions", items: [{ term: "Travel", body: "Travel and lodging are billed at cost with receipts." }] },
  terms_grid: { type: "terms_grid", items: [{ section: "S1", title: "Scope", body: "Scope as set forth in this proposal." }] },
  legal_panel: { type: "legal_panel", panels: [{ slug: "msa", label: "Master Services Agreement", body: "MSA placeholder — replace with full text or a signed link." }] },
  signature_block: { type: "signature_block", parties: [{ role: "Client" }, { role: "Producer", name: "flyingbluewhale" }], instructions: "Sign below to accept this proposal." },
  cta: { type: "cta", label: "Accept proposal", href: "#authorize", variant: "primary" },
  spacer: { type: "spacer", size: "md" },
  custom: { type: "custom", body: "<p>Custom HTML</p>" },
};

export function ProposalEditor({
  proposalId,
  defaults,
}: {
  proposalId: string;
  defaults: { title: string; doc_number: string; currency: string; deposit_percent: number; theme: { primary: string; secondary: string }; blocks: unknown[] };
}) {
  const [blocks, setBlocks] = useState<ProposalBlock[]>(() => defaults.blocks as ProposalBlock[]);
  const [json, setJson] = useState<string>(() => JSON.stringify(defaults.blocks, null, 2));
  const [mode, setMode] = useState<"outline" | "json">("outline");

  const [state, formAction, pending] = useActionState<EditState, FormData>(
    async (prev, fd) => {
      fd.set("blocks", mode === "json" ? json : JSON.stringify(blocks));
      const res = await saveProposalAction(proposalId, prev, fd);
      if (res?.error) toast.error(res.error);
      else if (res?.ok) toast.success("Proposal saved · v bumped");
      return res;
    },
    null,
  );

  const addBlock = (type: ProposalBlockType) => {
    setBlocks((b) => {
      const next = [...b, BLOCK_DEFAULTS[type]];
      setJson(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const removeBlock = (idx: number) => {
    setBlocks((b) => {
      const next = b.filter((_, i) => i !== idx);
      setJson(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    setBlocks((b) => {
      const next = [...b];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return b;
      [next[idx], next[target]] = [next[target], next[idx]];
      setJson(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const summary = useMemo(() => ({
    count: blocks.length,
    types: [...new Set(blocks.map((b) => b.type))].sort(),
  }), [blocks]);

  return (
    <form action={formAction} className="surface-raised space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Title" name="title" required defaultValue={defaults.title} />
        <Input label="Doc #" name="doc_number" defaultValue={defaults.doc_number} placeholder="FBW-001" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Currency</label>
            <select name="currency" defaultValue={defaults.currency} className="input-base mt-1.5 w-full">
              <option>USD</option><option>EUR</option><option>GBP</option><option>CAD</option>
            </select>
          </div>
          <Input label="Deposit %" name="deposit_percent" type="number" min="0" max="100" defaultValue={defaults.deposit_percent} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Theme primary" name="theme_primary" defaultValue={defaults.theme.primary} />
        <Input label="Theme secondary" name="theme_secondary" defaultValue={defaults.theme.secondary} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-[var(--text-muted)]">{summary.count} blocks · {summary.types.length} distinct types</div>
        <div className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5">
          <button type="button" onClick={() => { setBlocks(JSON.parse(json)); setMode("outline"); }} className={`rounded-full px-3 py-1 text-xs ${mode === "outline" ? "bg-[var(--background)] elevation-1" : "text-[var(--text-muted)]"}`}>Outline</button>
          <button type="button" onClick={() => { setJson(JSON.stringify(blocks, null, 2)); setMode("json"); }} className={`rounded-full px-3 py-1 text-xs ${mode === "json" ? "bg-[var(--background)] elevation-1" : "text-[var(--text-muted)]"}`}>JSON</button>
        </div>
      </div>

      {mode === "outline" ? (
        <div className="space-y-2">
          <ol className="space-y-2">
            {blocks.map((b, i) => (
              <li key={i} className="surface flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{i + 1} · {BLOCK_LABELS[b.type]}</div>
                  <div className="mt-0.5 truncate text-sm">{describeBlock(b)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => move(i, -1)} className="btn btn-ghost btn-sm" aria-label="Move up">↑</button>
                  <button type="button" onClick={() => move(i, 1)} className="btn btn-ghost btn-sm" aria-label="Move down">↓</button>
                  <button type="button" onClick={() => removeBlock(i)} className="btn btn-ghost btn-sm text-[var(--color-error)]" aria-label="Remove">✕</button>
                </div>
              </li>
            ))}
          </ol>

          <div className="surface-inset p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Add block</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addBlock(t)}
                  className="rounded-full border border-[var(--border-color)] px-2.5 py-1 text-xs hover:bg-[var(--bg-secondary)]"
                >
                  + {BLOCK_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Blocks JSON</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={24}
            spellCheck={false}
            className="input-base mt-1.5 w-full font-mono text-xs"
          />
        </div>
      )}

      {state?.error && (
        <div className="rounded-lg border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]">{state.error}</div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save proposal"}</Button>
      </div>
    </form>
  );
}

function describeBlock(b: ProposalBlock): string {
  switch (b.type) {
    case "hero": return b.title;
    case "section_eyebrow": return b.label;
    case "heading": return b.text;
    case "prose": return b.body.slice(0, 80);
    case "callout": return b.title ?? b.body.slice(0, 60);
    case "phase": return `${b.num}. ${b.name}`;
    case "investment_table": return `${b.groups.reduce((s, g) => s + g.items.length, 0)} line items`;
    case "total_block": return b.label;
    case "engagement_split": return `${b.depositPercent}% / ${b.balancePercent}%`;
    case "signature_block": return `${b.parties.length} signer(s)`;
    case "legal_panel": return `${b.panels.length} panel(s)`;
    case "exclusions": return `${b.items.length} exclusions`;
    case "equipment_manifest": return `${b.items.length} items`;
    case "terms_grid": return `${b.items.length} terms`;
    default: return "";
  }
}
