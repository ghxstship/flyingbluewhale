"use client";

import { useEffect, useState } from "react";

/**
 * `<ActivityTerminal>` — a live-looking, ticker-style activity feed in the
 * `.surface-terminal` aesthetic. Visually replicates the audit-log /
 * production-feed surface inside ATLVS so marketing visitors see the actual
 * texture of the product (mono type, timestamps, color-coded events) rather
 * than an abstract illustration.
 *
 * Content is scripted, not live. Loops through `EVENTS` and prepends one
 * row every ~2.2s up to MAX_VISIBLE. Old rows fade. Designed to read as
 * "the show is running right now" — receipts over promises.
 */
const EVENTS: Array<{ tone: "ok" | "warn" | "accent" | "dim"; tag: string; text: string }> = [
  { tone: "ok", tag: "GATE", text: "Scan ok · MMW26 · 02:14:51 · Gate B · sub-100ms" },
  { tone: "accent", tag: "RFI", text: "RFI #142 · official answer from D. Marlow · ball returned to GC" },
  { tone: "ok", tag: "PUNCH", text: "Punch #88 closed by site team · photo evidence attached" },
  { tone: "dim", tag: "ADV", text: "Rider v7 · SZA · approved by talent advancing" },
  { tone: "warn", tag: "INSP", text: "Inspection failed · backstage egress · re-test scheduled 16:00" },
  { tone: "ok", tag: "PAY", text: "Stripe Connect payout $42,180 → vendor:scenic_co · transit" },
  { tone: "accent", tag: "AI", text: "Recap drafted · Friday call sheet · 6 stages · awaiting review" },
  { tone: "ok", tag: "TIME", text: "47 crew clocked-in · offline queue replayed on signal return" },
  { tone: "dim", tag: "AUDIT", text: "Immutable log row #1,284,902 · actor:m.reyes · before/after stored" },
  { tone: "ok", tag: "GATE", text: "Manifest scan · vendor truck #14 · cleared dock 3" },
  { tone: "accent", tag: "PROP", text: "Proposal v3 · signed in place · IP captured · checkout fired" },
  { tone: "warn", tag: "INC", text: "Medic intake · patron triaged · transported · audit-logged" },
];

const MAX_VISIBLE = 8;
const TICK_MS = 2200;

function ts(offset: number) {
  // Synthetic monotonic timestamp for marketing copy — no real wall clock
  // so SSR matches client and a Lighthouse run gets a stable snapshot.
  const base = 7200 + offset * 47;
  const h = Math.floor(base / 3600) % 24;
  const m = Math.floor((base % 3600) / 60);
  const s = base % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ActivityTerminal() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const rows = Array.from({ length: MAX_VISIBLE }).map((_, i) => {
    const eventIdx = (tick - i + EVENTS.length * 8) % EVENTS.length;
    const e = EVENTS[eventIdx];
    return { ...e, ts: ts(tick - i), key: `${tick}-${i}` };
  });

  return (
    <div className="surface-terminal overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="term-prompt">$</span>
          <span className="term-dim">tail -f atlvs.production.log</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-wide uppercase">
          <span className="term-ok inline-flex items-center gap-1">
            <span className="status-dot status-dot-success status-dot-pulse" aria-hidden /> live
          </span>
        </div>
      </div>
      <ul className="divide-y divide-[color-mix(in_oklab,var(--border-color)_25%,transparent)]">
        {rows.map((r, i) => {
          const toneClass =
            r.tone === "ok"
              ? "term-ok"
              : r.tone === "warn"
                ? "term-warn"
                : r.tone === "accent"
                  ? "term-accent"
                  : "term-dim";
          return (
            <li
              key={r.key}
              className="flex items-baseline gap-3 px-4 py-2 transition-opacity"
              style={{ opacity: 1 - i * 0.08 }}
            >
              <span className="term-dim shrink-0 tabular-nums">{r.ts}</span>
              <span className={`shrink-0 font-semibold tracking-wide ${toneClass}`} style={{ minWidth: "3.25rem" }}>
                {r.tag}
              </span>
              <span className="truncate">{r.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
