"use client";

import { useState } from "react";
import { useFormatters } from "@/lib/i18n/LocaleProvider";
import { Check, Square } from "lucide-react";
import { SelectableCard } from "@/components/ui/SelectableCard";
import type { ProposalBlock, Money } from "@/lib/proposals/types";

type PhaseBlockType = Extract<ProposalBlock, { type: "phase" }>;

function fmtMoney(
  m: Money | string | undefined,
  currency: string,
  moneyFmt: (cents: number, cur?: string) => string,
): string {
  if (m == null) return "";
  if (typeof m === "string") return m;
  return moneyFmt(m.cents, m.currency ?? currency);
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
  const { money: moneyFmt } = useFormatters();
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
        className="surface relative flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
        <span className="font-mono text-3xl font-light" style={{ color: accent }}>
          {String(block.num).padStart(2, "0")}
        </span>
        <div className="flex-1">
          {block.tag && (
            <div className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
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
          {block.narrative && <p className="text-sm text-[var(--text-secondary)]">{block.narrative}</p>}

          {block.core && block.core.length > 0 && (
            <div className="mt-5">
              <div className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
                Included
              </div>
              <ul className="mt-2 space-y-2">
                {block.core.map((c, i) => (
                  <li
                    key={i}
                    className="relative flex items-start justify-between gap-4 border-l-2 pl-4"
                    style={{ borderColor: accent }}
                  >
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      {c.desc && <div className="text-xs text-[var(--text-muted)]">{c.desc}</div>}
                    </div>
                    {c.price != null && (
                      <div className="font-display text-base tabular-nums">{fmtMoney(c.price, currency, moneyFmt)}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {block.addons && block.addons.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">
                Add-ons{" "}
                {addonTotalCents > 0 && (
                  <span className="ml-2 font-mono text-[var(--foreground)] normal-case">
                    +{fmtMoney({ cents: addonTotalCents }, currency, moneyFmt)} selected
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
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${isOn ? "text-white" : "border-[var(--border-color)]"}`}
                            style={isOn ? { background: accent, borderColor: accent } : {}}
                            aria-hidden="true"
                          >
                            {isOn && <Check size={12} strokeWidth={3} />}
                          </span>
                        }
                        trailing={
                          a.price != null ? (
                            <span className="font-mono text-xs">{fmtMoney(a.price, currency, moneyFmt)}</span>
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
            <div className="mt-6 rounded-lg border border-dashed border-[var(--border-color)] p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rotate-45" style={{ background: accent }} />
                <div className="text-[10px] font-semibold tracking-widest uppercase">{block.gate.title}</div>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                {block.gate.items.map((i, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Square size={12} strokeWidth={2} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{i}</span>
                  </li>
                ))}
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
                <span key={r} className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 font-mono text-[10px]">
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
