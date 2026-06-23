import type { ReactNode } from "react";

/**
 * TicketCTA — the GVTEWAY ticketing call-to-action (design_handoff §2, kit
 * p0.jsx → States). Ticketing is INTEGRATION-ONLY — never an in-app checkout.
 * Every "Get tickets" is a HANDOFF to the provider, labelled `via <PROVIDER>`
 * as a PLAIN-TEXT wordmark (never a recreated or recolored partner logo).
 *
 * State machine: on_sale · selling_fast · waitlist · sold_out · resale · owned.
 */
export type TicketState = "on_sale" | "selling_fast" | "waitlist" | "sold_out" | "resale" | "owned";
export type TicketProvider = "DICE" | "RA" | "AXS" | "Ticketmaster" | "Eventbrite";

const COPY: Record<TicketState, { label: string; tone: string; sub?: string; actionable: boolean }> = {
  on_sale: { label: "Get tickets", tone: "var(--p-accent-cta)", actionable: true },
  selling_fast: { label: "Get tickets", tone: "var(--p-accent-cta)", sub: "Selling fast", actionable: true },
  waitlist: { label: "Join waitlist", tone: "var(--p-surface-2)", actionable: true },
  sold_out: { label: "Sold out", tone: "var(--p-surface-2)", sub: "Check resale", actionable: false },
  resale: { label: "Browse resale", tone: "var(--p-surface-2)", actionable: true },
  owned: { label: "You're in", tone: "var(--p-success)", sub: "Ticket in your wallet", actionable: false },
};

export function TicketCTA({
  state,
  provider,
  href,
  className = "",
}: {
  state: TicketState;
  /** The ticketing provider the handoff goes to. */
  provider?: TicketProvider;
  /** The provider deep-link. Required when the state is actionable. */
  href?: string;
  className?: string;
}) {
  const c = COPY[state];
  const onAccent = state === "on_sale" || state === "selling_fast";
  const ink = onAccent ? "var(--p-accent-cta-contrast)" : state === "owned" ? "var(--p-success-text, var(--p-text-1))" : "var(--p-text-1)";

  const inner: ReactNode = (
    <span className="inline-flex items-center gap-2">
      {c.label}
      {c.sub && (
        <span className="text-xs font-normal opacity-80">· {c.sub}</span>
      )}
    </span>
  );

  const base = "inline-flex flex-col items-start gap-1";
  const btn =
    "rounded-[var(--p-r,8px)] px-5 py-2.5 text-sm font-semibold transition-[filter] " +
    (onAccent ? "hover:brightness-95" : "border border-[var(--p-border-2)] hover:bg-[var(--p-surface-2)]");

  return (
    <div className={[base, className].join(" ")}>
      {c.actionable && href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={btn} style={{ background: c.tone, color: ink }}>
          {inner}
        </a>
      ) : (
        <span className={btn} style={{ background: c.tone, color: ink }} aria-disabled={!c.actionable}>
          {inner}
        </span>
      )}
      {provider && c.actionable && (
        // Plain-text wordmark — NEVER a recreated provider logo.
        <span className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">via {provider}</span>
      )}
    </div>
  );
}
