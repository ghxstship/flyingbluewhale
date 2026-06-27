/**
 * Proposal record-binding bridge — maps a System-B `proposals.blocks` document
 * (the rich 17-section ProposalBlock[] authored in the proposal builder) into
 * the kit `proposal` document template's merge-field data object (keyed by the
 * template's `data-path`s, see contract.ts + registry.ts).
 *
 * This is the seam that reconciles the two proposal renderings: the builder
 * (src/lib/proposals) owns authoring + the on-its-own-page viewer; the kit
 * documents engine owns the OpenAPI-described, print-clean `.doc` artifact.
 * One stored `blocks` document now drives BOTH, so they can never drift.
 *
 * Pure + dependency-light (types + the locale money formatter only) so it
 * unit-tests without a DB or `server-only` — the resolver in resolvers.ts wraps
 * it with the org-scoped fetch + identity defaults.
 */
import type { ProposalBlock, Money } from "@/lib/proposals/types";
import { formatMoney } from "@/lib/i18n/format";
import { PROPOSAL_DEPOSIT_PCT_DEFAULT } from "@/lib/payment-terms";

type DocData = Record<string, unknown>;

/**
 * Block types that carry no document-body content — they are navigation /
 * presentation chrome in the interactive builder (section dividers, headings,
 * spacers, the CTA button, the live signature widget). They are intentionally
 * NOT bound into the kit summary artifact. Every OTHER block type must
 * contribute bound data; `proposal-binding.test.ts` guards that no
 * content-bearing type is ever silently dropped again.
 */
export const STRUCTURAL_BLOCK_TYPES: ReadonlySet<ProposalBlock["type"]> = new Set([
  "section_eyebrow",
  "heading",
  "spacer",
  "cta",
  "signature_block",
]);

/** Strip tags from a `custom` HTML block so its text folds into the print-clean doc. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function moneyStr(m: Money | string | undefined | null, currency: string): string | undefined {
  if (m == null) return undefined;
  if (typeof m === "string") return m.length ? m : undefined;
  return formatMoney(m.cents, m.currency ?? currency);
}

export type ProposalBindingContext = {
  currency?: string | null;
  depositPercent?: number | null;
  amountCents?: number | null;
};

/**
 * Map the builder's blocks → the kit proposal template's data object. Only
 * fields the blocks actually carry are emitted; everything else is omitted so
 * the engine's resolve() falls back to the template sample (honest coverage —
 * a partially-authored proposal still renders complete + correct).
 */
export function proposalDataFromBlocks(blocks: ProposalBlock[], ctx: ProposalBindingContext = {}): DocData {
  const currency = (ctx.currency || "USD").toUpperCase();

  const project: Record<string, unknown> = {};
  const scope: { category?: string; label?: string; amount?: string }[] = [];
  const sites: { name?: string; brief?: string }[] = [];
  const phases: { name?: string; focus?: string; gate?: string }[] = [];
  const schedule: { milestone?: string; phase?: string; date?: string }[] = [];
  const investLines: { phase?: string; amount?: string }[] = [];
  const invest: Record<string, unknown> = {};
  const payment: Record<string, unknown> = {};
  const changes: { name?: string; detail?: string; price?: string }[] = [];
  const exclusions: string[] = [];
  const terms: { title?: string; body?: string }[] = [];
  const narrative: string[] = [];

  for (const b of blocks) {
    switch (b.type) {
      case "hero": {
        if (b.title) project.title = b.title;
        if (b.subtitle) project.objective = b.subtitle;
        else if (b.narrative) project.objective = b.narrative;
        for (const m of b.meta ?? []) {
          const key = m.label.toLowerCase();
          if (key.includes("venue") || key.includes("location")) project.venue = m.value;
          else if (key.includes("type") || key.includes("scope")) project.type = m.value;
        }
        break;
      }
      case "overview_cards": {
        for (const c of b.cards) {
          sites.push({ name: c.title, brief: c.details.map((d) => `${d.label}: ${d.value}`).join(" · ") || undefined });
        }
        break;
      }
      case "phase": {
        phases.push({ name: b.name, focus: b.tag ?? b.narrative ?? undefined, gate: b.gate?.title });
        for (const it of b.items ?? []) {
          scope.push({ category: b.name, label: it.label, amount: formatMoney(it.amountCents, currency) });
        }
        for (const c of b.core ?? []) {
          scope.push({ category: b.name, label: c.name, amount: moneyStr(c.price, currency) });
        }
        break;
      }
      case "schedule_table": {
        for (const r of b.rows) schedule.push({ milestone: r.milestone, phase: r.phase, date: r.date });
        break;
      }
      case "investment_table": {
        for (const g of b.groups) {
          let cents = 0;
          let hasMoney = false;
          for (const it of g.items) {
            if (typeof it.price === "object" && it.price) {
              cents += it.price.cents;
              hasMoney = true;
            }
          }
          investLines.push({ phase: g.label, amount: hasMoney ? formatMoney(cents, currency) : undefined });
        }
        invest.total = moneyStr(b.total, currency);
        break;
      }
      case "total_block": {
        invest.total = moneyStr(b.amount, currency);
        break;
      }
      case "engagement_split": {
        payment.depositPct = `${b.depositPercent}%`;
        payment.balancePct = `${b.balancePercent}%`;
        if (b.depositLabel) payment.depositTerms = b.depositLabel;
        if (b.balanceLabel) payment.balanceTerms = b.balanceLabel;
        break;
      }
      case "payment_method": {
        payment.method = b.method.toUpperCase();
        break;
      }
      case "change_orders": {
        for (const it of b.items) {
          changes.push({ name: it.name, detail: it.description, price: moneyStr(it.price, currency) });
        }
        break;
      }
      case "exclusions": {
        for (const it of b.items) exclusions.push(`${it.term}. ${it.body}`);
        break;
      }
      case "terms_grid": {
        for (const it of b.items) terms.push({ title: it.title, body: it.body });
        break;
      }
      case "legal_panel": {
        for (const p of b.panels) terms.push({ title: p.label, body: p.body });
        break;
      }
      // ── freeform narrative / approach copy ────────────────────────────────
      case "prose": {
        if (b.body) narrative.push(b.body);
        break;
      }
      case "callout": {
        if (b.body) narrative.push(b.title ? `${b.title}: ${b.body}` : b.body);
        break;
      }
      case "capabilities": {
        for (const c of b.cards) narrative.push(c.body ? `${c.title} — ${c.body}` : c.title);
        break;
      }
      case "custom": {
        const text = stripHtml(b.body);
        if (text) narrative.push(text);
        break;
      }
      // ── journey steps are a milestone timeline → the schedule namespace ────
      case "journey": {
        for (const s of b.steps) {
          schedule.push({ milestone: s.title, phase: s.status ?? s.description, date: s.date });
        }
        break;
      }
      // ── equipment manifest lines are scope-of-work items ──────────────────
      case "equipment_manifest": {
        for (const it of b.items) {
          scope.push({
            category: "Equipment & Technical",
            label: it.quantity != null ? `${it.name} (×${it.quantity})` : it.name,
            amount: it.vendor ?? undefined,
          });
        }
        break;
      }
    }
  }

  // Engagement amounts: derive deposit/balance from the canonical split when the
  // blocks didn't state them explicitly but the record carries a total.
  if (ctx.amountCents != null) {
    const pct = ctx.depositPercent ?? PROPOSAL_DEPOSIT_PCT_DEFAULT;
    payment.depositPct ??= `${pct}%`;
    payment.balancePct ??= `${100 - pct}%`;
    payment.depositAmount = formatMoney(Math.round((ctx.amountCents * pct) / 100), currency);
    payment.balanceAmount = formatMoney(Math.round((ctx.amountCents * (100 - pct)) / 100), currency);
    invest.total ??= formatMoney(ctx.amountCents, currency);
  }

  const data: DocData = {};
  if (Object.keys(project).length) data.project = project;
  if (narrative.length) data.narrative = narrative;
  if (scope.length) data.scope = scope;
  if (sites.length) data.sites = sites;
  if (phases.length) data.phases = phases;
  if (schedule.length) data.schedule = schedule;
  investLines.forEach((line, i) => {
    invest[String(i)] = line;
  });
  if (Object.keys(invest).length) data.invest = invest;
  if (Object.keys(payment).length) data.payment = payment;
  if (changes.length) data.changes = changes;
  if (exclusions.length) data.exclusions = exclusions;
  if (terms.length) data.terms = terms;
  return data;
}
