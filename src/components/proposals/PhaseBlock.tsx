"use client";

import { useState } from "react";
import type { ProposalBlock, Money } from "@/lib/proposals/types";

type PhaseBlockType = Extract<ProposalBlock, { type: "phase" }>;

function fmtMoney(m: Money | string | undefined, currency = "USD"): string {
  if (m == null) return "";
  if (typeof m === "string") return m;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: m.currency ?? currency, maximumFractionDigits: 0 }).format(m.cents / 100);
}

export function PhaseBlock({ block, theme, currency }: { block: PhaseBlockType; theme: { primary: string; secondary: string }; currency: string }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const accent = block.accent ?? theme.primary;

  const addonTotalCents = (block.addons ?? []).reduce((sum, a) => {
    if (!picked.has(a.id)) return sum;
    const p = a.price;
    if (p && typeof p === "object" && typeof p.cents === "number") return sum + p.cents;
    return sum;
  }, 0);

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <section id={block.id} className="mx-auto max-w-4xl px-8 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="surface-raised relative flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
        <span className="font-mono text-3xl font-light" style={{ color: accent }}>{String(block.num).padStart(2, "0")}</span>
        <div className="flex-1">
          {block.tag && <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">{block.tag}</div>}
          <div className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{block.name}</div>
        </div>
        <span className="font-mono text-2xl transition-transform" style={{ transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>

      {open && (
        <div className="surface mt-2 p-6 animate-fade-in">
          {block.narrative && <p className="text-sm text-[var(--text-secondary)]">{block.narrative}</p>}

          {block.core && block.core.length > 0 && (
            <div className="mt-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">Included</div>
              <ul className="mt-2 space-y-2">
                {block.core.map((c, i) => (
                  <li key={i} className="relative flex items-start justify-between gap-4 border-l-2 pl-4" style={{ borderColor: accent }}>
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      {c.desc && <div className="text-xs text-[var(--text-muted)]">{c.desc}</div>}
                    </div>
                    {c.price != null && (
                      <div className="font-serif text-base" style={{ fontFamily: "var(--font-serif), Cormorant Garamond, serif" }}>{fmtMoney(c.price, currency)}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {block.addons && block.addons.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Add-ons {addonTotalCents > 0 && <span className="ml-2 font-mono normal-case text-[var(--foreground)]">+{fmtMoney({ cents: addonTotalCents }, currency)} selected</span>}
              </div>
              <ul className="mt-2 space-y-2">
                {block.addons.map((a) => {
                  const isOn = picked.has(a.id);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => togglePick(a.id)}
                        className={`flex w-full items-start justify-between gap-4 rounded-lg border p-3 text-left transition ${isOn ? "border-[var(--org-primary)] bg-[var(--bg-secondary)]" : "border-[var(--border-color)]"}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${isOn ? "text-white" : "border-[var(--border-color)]"}`}
                            style={isOn ? { background: accent, borderColor: accent } : {}}
                          >
                            {isOn ? "✓" : ""}
                          </span>
                          <div>
                            <div className="text-sm font-medium">{a.name}</div>
                            {a.desc && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{a.desc}</div>}
                          </div>
                        </div>
                        {a.price != null && (
                          <div className="font-mono text-xs">{fmtMoney(a.price, currency)}</div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {block.gate && (
            <div className="mt-6 rounded-lg border border-dashed border-[var(--border-color)] p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rotate-45" style={{ background: accent }} />
                <div className="text-[10px] font-semibold uppercase tracking-widest">{block.gate.title}</div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                {block.gate.items.map((i, idx) => <li key={idx}>☐ {i}</li>)}
              </ul>
              {block.gate.unlocks && (
                <div className="mt-2 text-[11px] text-[var(--text-muted)]">→ unlocks {block.gate.unlocks}</div>
              )}
            </div>
          )}

          {block.contractRefs && block.contractRefs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              <span className="text-[10px] text-[var(--text-muted)]">Contractual framework:</span>
              {block.contractRefs.map((r) => (
                <span key={r} className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px]">{r}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
