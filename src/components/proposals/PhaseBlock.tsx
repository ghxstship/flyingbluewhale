"use client";

import { useState } from "react";
import { Check, Square } from "lucide-react";
import { SelectableCard } from "@/components/ui/SelectableCard";
import type { ProposalBlock, Money } from "@/lib/proposals/types";

type PhaseBlockType = Extract<ProposalBlock, { type: "phase" }>;

function fmtMoney(m: Money | string | undefined, currency = "USD"): string {
  if (m == null) return "";
  if (typeof m === "string") return m;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: m.currency ?? currency,
    maximumFractionDigits: 0,
  }).format(m.cents / 100);
}

export function PhaseBlock({
  block,
  theme,
  currency,
}: {
  block: PhaseBlockType;
  theme: { primary: string; secondary: string };
  currency: string;
}) {
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section id={block.id} className="mx-auto max-w-4xl px-8 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="surface relative flex w-full items-center gap-4 p-5 text-start"
      >
        <span className="absolute inset-y-0 start-0 w-1" style={{ background: accent }} />
        <span className="font-mono text-3xl font-light" style={{ color: accent }}>
          {String(block.num).padStart(2, "0")}
        </span>
        <div className="flex-1">
          {block.tag && (
            <div className="text-[11px] font-semibold tracking-widest text-[var(--p-text-2)] uppercase">
              {block.tag}
            </div>
          )}
          <div className="font-subdisplay text-xl tracking-wide">{block.name}</div>
        </div>
        <span
          className="font-mono text-2xl transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "none" }}
        >
          +
        </span>
      </button>

      {open && (
        <div className="surface animate-fade-in mt-2 p-6">
          {block.narrative && <p className="text-sm text-[var(--p-text-2)]">{block.narrative}</p>}

          {block.core && block.core.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] font-semibold tracking-widest text-[var(--p-text-2)] uppercase">Included</div>
              <ul className="mt-2 space-y-2">
                {block.core.map((c, i) => (
                  <li
                    key={i}
                    className="relative flex items-start justify-between gap-4 border-s-2 ps-4"
                    style={{ borderColor: accent }}
                  >
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      {c.desc && <div className="text-xs text-[var(--p-text-2)]">{c.desc}</div>}
                    </div>
                    {c.price != null && (
                      <div className="font-display text-base tabular-nums">{fmtMoney(c.price, currency)}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {block.addons && block.addons.length > 0 && (
            <div className="mt-6">
              <div className="text-[11px] font-semibold tracking-widest text-[var(--p-text-2)] uppercase">
                Add-ons{" "}
                {addonTotalCents > 0 && (
                  <span className="ms-2 font-mono text-[var(--p-text-1)] normal-case">
                    +{fmtMoney({ cents: addonTotalCents }, currency)} selected
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-2" role="group" aria-label="Add-ons">
                {block.addons.map((a) => {
                  const isOn = picked.has(a.id);
                  return (
                    <li key={a.id}>
                      <SelectableCard
                        selectionRole="checkbox"
                        selected={isOn}
                        onClick={() => togglePick(a.id)}
                        title={a.name}
                        description={a.desc}
                        leading={
                          <span
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${isOn ? "text-white" : "border-[var(--p-border)]"}`}
                            style={isOn ? { background: accent, borderColor: accent } : {}}
                            aria-hidden="true"
                          >
                            {isOn && <Check size={12} strokeWidth={3} />}
                          </span>
                        }
                        trailing={
                          a.price != null ? (
                            <span className="font-mono text-xs">{fmtMoney(a.price, currency)}</span>
                          ) : undefined
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {block.gate && (
            <div className="mt-6 rounded-lg border border-dashed border-[var(--p-border)] p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rotate-45" style={{ background: accent }} />
                <div className="text-[11px] font-semibold tracking-widest uppercase">{block.gate.title}</div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-[var(--p-text-2)]">
                {block.gate.items.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Square size={12} strokeWidth={2} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              {block.gate.unlocks && (
                <div className="mt-2 text-[11px] text-[var(--p-text-2)]">→ unlocks {block.gate.unlocks}</div>
              )}
            </div>
          )}

          {block.contractRefs && block.contractRefs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              <span className="text-[11px] text-[var(--p-text-2)]">Contractual framework:</span>
              {block.contractRefs.map((r) => (
                <span key={r} className="rounded-full bg-[var(--p-surface)] px-2 py-0.5 font-mono text-[11px]">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
