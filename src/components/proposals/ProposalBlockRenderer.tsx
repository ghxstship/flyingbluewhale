import Link from "next/link";
import type { ProposalBlock, Money } from "@/lib/proposals/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { PhaseBlock } from "./PhaseBlock";

function fmtMoney(m: Money | string | undefined, currency = "USD"): string {
  if (m == null) return "";
  if (typeof m === "string") return m;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency ?? currency, maximumFractionDigits: 0 }).format(m.cents / 100);
}

export function ProposalBlockRenderer({ blocks, theme, currency = "USD" }: {
  blocks: ProposalBlock[];
  theme: { primary: string; secondary: string };
  currency?: string;
}) {
  return (
    <>
      {blocks.map((b, i) => <BlockSwitch key={i} block={b} theme={theme} currency={currency} />)}
    </>
  );
}

function BlockSwitch({ block, theme, currency }: { block: ProposalBlock; theme: { primary: string; secondary: string }; currency: string }) {
  switch (block.type) {
    case "hero": return <HeroBlock block={block} theme={theme} />;
    case "section_eyebrow": return <EyebrowBlock block={block} theme={theme} />;
    case "heading": return <HeadingBlock block={block} />;
    case "prose": return <p className="prose-block mx-auto max-w-2xl text-base leading-relaxed">{block.body}</p>;
    case "callout": return <CalloutBlock block={block} />;
    case "overview_cards": return <OverviewCards block={block} theme={theme} />;
    case "phase": return <PhaseBlock block={block} theme={theme} currency={currency} />;
    case "journey": return <JourneyBlock block={block} theme={theme} />;
    case "schedule_table": return <ScheduleTable block={block} />;
    case "capabilities": return <CapabilitiesBlock block={block} />;
    case "investment_table": return <InvestmentTable block={block} currency={currency} />;
    case "total_block": return <TotalBlock block={block} currency={currency} />;
    case "engagement_split": return <EngagementSplit block={block} theme={theme} />;
    case "payment_method": return <PaymentMethodCard block={block} />;
    case "equipment_manifest": return <EquipmentManifest block={block} />;
    case "change_orders": return <ChangeOrders block={block} currency={currency} />;
    case "exclusions": return <Exclusions block={block} />;
    case "terms_grid": return <TermsGrid block={block} />;
    case "legal_panel": return <LegalPanel block={block} />;
    case "signature_block": return null; // signature is handled by a dedicated client component in the viewer
    case "cta": return (
      <div className="mx-auto my-6 max-w-2xl text-center">
        <Link href={block.href} className={`btn ${block.variant === "secondary" ? "btn-secondary" : "btn-primary"}`}>{block.label}</Link>
      </div>
    );
    case "spacer": return <div className={block.size === "lg" ? "h-16" : block.size === "sm" ? "h-4" : "h-10"} />;
    case "custom": return <div className="prose mx-auto max-w-2xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.body) }} />;
  }
}

function accent(theme: { primary: string; secondary: string }, override?: string) {
  return override ?? theme.primary;
}

function HeroBlock({ block, theme }: { block: Extract<ProposalBlock, { type: "hero" }>; theme: { primary: string; secondary: string } }) {
  const a = accent(theme, block.accent);
  return (
    <section className="proposal-hero relative overflow-hidden border-b border-[var(--border-color)]">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: `linear-gradient(180deg, ${theme.primary}, ${theme.secondary})` }} />
      <div className="mx-auto max-w-4xl px-8 py-20">
        {block.eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: a }}>
            {block.eyebrow}
          </div>
        )}
        <h1 className="mt-4 font-serif text-5xl font-light tracking-tight text-balance sm:text-7xl" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>
          {block.title}
        </h1>
        {block.subtitle && <p className="mt-4 text-lg text-[var(--text-secondary)]">{block.subtitle}</p>}
        {block.partners && block.partners.length > 0 && (
          <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {block.partners.map((p, i) => (
              <span key={i} className="flex items-center gap-3">
                {i > 0 && <span className="opacity-40">×</span>}
                <span>{p}</span>
              </span>
            ))}
          </div>
        )}
        {block.meta && block.meta.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {block.meta.map((m, i) => (
              <div key={i}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{m.label}</div>
                <div className="mt-1 font-mono text-sm">{m.value}</div>
              </div>
            ))}
          </div>
        )}
        {block.narrative && <p className="mt-8 max-w-2xl text-sm text-[var(--text-secondary)]">{block.narrative}</p>}
      </div>
    </section>
  );
}

function EyebrowBlock({ block, theme }: { block: Extract<ProposalBlock, { type: "section_eyebrow" }>; theme: { primary: string; secondary: string } }) {
  const a = accent(theme, block.accent);
  return (
    <div className="mx-auto mt-16 flex max-w-4xl items-center gap-3 px-8">
      <span className="block h-8 w-1" style={{ background: a }} />
      <span className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: a }}>{block.label}</span>
    </div>
  );
}

function HeadingBlock({ block }: { block: Extract<ProposalBlock, { type: "heading" }> }) {
  const cls = block.level === 3
    ? "mt-6 font-serif text-2xl tracking-tight"
    : "mt-4 font-serif text-3xl tracking-tight sm:text-4xl";
  return (
    <div className="mx-auto max-w-4xl px-8">
      <h2 className={cls} style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{block.text}</h2>
    </div>
  );
}

function CalloutBlock({ block }: { block: Extract<ProposalBlock, { type: "callout" }> }) {
  const kindClass =
    block.kind === "red"  ? "border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10" :
    block.kind === "gold" ? "border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10" :
    block.kind === "teal" ? "border-sky-500/30 bg-sky-500/10" :
                            "border-pink-500/30 bg-pink-500/10";
  return (
    <div className={`mx-auto my-4 max-w-2xl rounded-lg border p-4 ${kindClass}`}>
      {block.title && <div className="text-xs font-semibold uppercase tracking-widest">{block.title}</div>}
      <div className="mt-1 text-sm whitespace-pre-wrap">{block.body}</div>
    </div>
  );
}

function OverviewCards({ block, theme }: { block: Extract<ProposalBlock, { type: "overview_cards" }>; theme: { primary: string; secondary: string } }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-6">
      <div className="grid gap-3 md:grid-cols-3">
        {block.cards.map((c, i) => {
          const a = accent(theme, c.accent);
          return (
            <div key={i} className="surface relative overflow-hidden p-5 pl-6">
              <span className="absolute inset-y-0 left-0 w-1" style={{ background: a }} />
              {c.tag && <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>{c.tag}</div>}
              <h3 className="mt-2 font-serif text-xl" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{c.title}</h3>
              <dl className="mt-3 space-y-1 text-xs">
                {c.details.map((d, j) => (
                  <div key={j} className="flex justify-between gap-4 border-b border-dashed border-[var(--border-color)] py-1">
                    <dt className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">{d.label}</dt>
                    <dd className="text-right font-mono">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function JourneyBlock({ block, theme }: { block: Extract<ProposalBlock, { type: "journey" }>; theme: { primary: string; secondary: string } }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {block.steps.map((s) => (
          <div key={s.num} className="surface relative p-4">
            <div className="absolute right-4 top-4 font-mono text-xs text-[var(--text-muted)]">{s.status ?? ""}</div>
            <div className="font-mono text-4xl font-light tracking-tight" style={{ color: theme.primary }}>{String(s.num).padStart(2, "0")}</div>
            <div className="mt-2 text-sm font-semibold">{s.title}</div>
            {s.description && <div className="mt-1 text-xs text-[var(--text-muted)]">{s.description}</div>}
            {s.date && <div className="mt-2 font-mono text-xs">{s.date}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function ScheduleTable({ block }: { block: Extract<ProposalBlock, { type: "schedule_table" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="surface overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Phase</th><th>Milestone</th><th>Date</th></tr></thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i}><td>{r.phase}</td><td>{r.milestone}</td><td className="font-mono text-xs">{r.date}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CapabilitiesBlock({ block }: { block: Extract<ProposalBlock, { type: "capabilities" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="grid gap-3 md:grid-cols-3">
        {block.cards.map((c, i) => (
          <div key={i} className="surface p-5">
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InvestmentTable({ block, currency }: { block: Extract<ProposalBlock, { type: "investment_table" }>; currency: string }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="surface overflow-x-auto">
        <table className="data-table">
          <tbody>
            {block.groups.map((g, gi) => (
              <>
                <tr key={`h-${gi}`}><td colSpan={2} className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{g.label}</td></tr>
                {g.items.map((it, ii) => (
                  <tr key={`i-${gi}-${ii}`}>
                    <td>
                      <div className="text-sm font-medium">{it.name}</div>
                      {it.desc && <div className="text-xs text-[var(--text-muted)]">{it.desc}</div>}
                    </td>
                    <td className="w-36 text-right font-serif text-lg" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{fmtMoney(it.price, currency)}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="text-sm font-semibold uppercase tracking-wider">Total investment</td>
              <td className="text-right font-serif text-2xl" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{fmtMoney(block.total, currency)}</td>
            </tr>
          </tfoot>
        </table>
        {block.taxNote && <p className="p-4 text-xs text-[var(--text-muted)]">{block.taxNote}</p>}
      </div>
    </section>
  );
}

function TotalBlock({ block, currency }: { block: Extract<ProposalBlock, { type: "total_block" }>; currency: string }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="surface-raised rounded-2xl p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: block.accent ?? "var(--org-primary)" }}>{block.label}</div>
        <div className="mt-4 font-serif text-6xl font-light tracking-tight" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{fmtMoney(block.amount, currency)}</div>
        {block.note && <div className="mt-3 text-xs text-[var(--text-muted)]">{block.note}</div>}
      </div>
    </section>
  );
}

function EngagementSplit({ block, theme }: { block: Extract<ProposalBlock, { type: "engagement_split" }>; theme: { primary: string; secondary: string } }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="surface-raised relative overflow-hidden p-6">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: theme.primary }} />
          <div className="text-[10px] font-semibold uppercase tracking-widest">Engagement deposit</div>
          <div className="mt-3 font-serif text-4xl" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{block.depositPercent}%</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{block.depositLabel ?? "Due on contract signature"}</div>
        </div>
        <div className="surface-raised relative overflow-hidden p-6">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: theme.secondary }} />
          <div className="text-[10px] font-semibold uppercase tracking-widest">Balance</div>
          <div className="mt-3 font-serif text-4xl" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{block.balancePercent}%</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">{block.balanceLabel ?? "Due 30 days before event"}</div>
        </div>
      </div>
    </section>
  );
}

function PaymentMethodCard({ block }: { block: Extract<ProposalBlock, { type: "payment_method" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="surface p-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Payment method · {block.method.toUpperCase()}</div>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
          {Object.entries(block.details).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-dashed border-[var(--border-color)] py-1">
              <dt className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">{k}</dt>
              <dd className="text-right font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function EquipmentManifest({ block }: { block: Extract<ProposalBlock, { type: "equipment_manifest" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="surface p-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Technical production package</div>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2 text-sm">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-3 border-b border-dashed border-[var(--border-color)] py-1.5">
              <span>
                {it.url
                  ? <a href={it.url} target="_blank" rel="noreferrer" className="text-[var(--org-primary)] hover:underline">{it.name}</a>
                  : <span>{it.name}</span>}
                {it.vendor && <span className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">{it.vendor}</span>}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">×{it.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ChangeOrders({ block, currency }: { block: Extract<ProposalBlock, { type: "change_orders" }>; currency: string }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="grid gap-3 md:grid-cols-2">
        {block.items.map((it, i) => (
          <div key={i} className="rounded-lg border border-dashed border-[var(--border-color)] p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{it.name}</div>
              <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Available</span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">{it.description}</div>
            {it.price != null && <div className="mt-2 font-mono text-xs">{fmtMoney(it.price, currency)}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Exclusions({ block }: { block: Extract<ProposalBlock, { type: "exclusions" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <ul className="space-y-2">
        {block.items.map((it, i) => (
          <li key={i} className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--foreground)]">{it.term}.</span> {it.body}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TermsGrid({ block }: { block: Extract<ProposalBlock, { type: "terms_grid" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="grid gap-3 md:grid-cols-2">
        {block.items.map((it, i) => (
          <div key={i} className="surface p-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">{it.section}</span>
              <span className="text-sm font-semibold">{it.title}</span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LegalPanel({ block }: { block: Extract<ProposalBlock, { type: "legal_panel" }> }) {
  return (
    <section className="mx-auto max-w-4xl px-8 py-4">
      <div className="grid gap-3 md:grid-cols-3">
        {block.panels.map((p) => (
          <details key={p.slug} className="surface p-4">
            <summary className="cursor-pointer text-sm font-semibold">{p.label}</summary>
            <div className="mt-3 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">{p.body}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
