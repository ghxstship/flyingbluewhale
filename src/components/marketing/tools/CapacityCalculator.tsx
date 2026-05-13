"use client";

import { useState, useMemo } from "react";

const USE_TYPES: Array<{ slug: string; label: string; sqftPerPerson: number; hint: string }> = [
  {
    slug: "standing",
    label: "Assembly — Standing",
    sqftPerPerson: 5,
    hint: "Concert floor, dance, GA standing — IBC 5 sf net",
  },
  {
    slug: "concentrated",
    label: "Assembly — Concentrated",
    sqftPerPerson: 7,
    hint: "Fixed seating, chair rows — IBC 7 sf net",
  },
  {
    slug: "unconcentrated",
    label: "Assembly — Unconcentrated (tables)",
    sqftPerPerson: 15,
    hint: "Banquet seating, gala dining — IBC 15 sf net",
  },
  { slug: "waiting", label: "Waiting / Queueing", sqftPerPerson: 3, hint: "Lobby, queue line — IBC 3 sf net" },
  { slug: "dance", label: "Dance Floor (no chairs)", sqftPerPerson: 5, hint: "Standing/dance only" },
  {
    slug: "reception",
    label: "Reception (standing + circulation)",
    sqftPerPerson: 8,
    hint: "Cocktail reception with light circulation",
  },
  { slug: "exhibit", label: "Exhibit / Convention floor", sqftPerPerson: 30, hint: "Booth-based gallery use" },
];

export function CapacityCalculator() {
  const [sqft, setSqft] = useState(5000);
  const [useType, setUseType] = useState(USE_TYPES[0].slug);
  const [usableFactor, setUsableFactor] = useState(80);

  const selectedUse = USE_TYPES.find((u) => u.slug === useType) ?? USE_TYPES[0];

  const usableSqft = useMemo(() => Math.max(0, sqft) * (Math.max(0, usableFactor) / 100), [sqft, usableFactor]);
  const occupancy = useMemo(() => Math.floor(usableSqft / selectedUse.sqftPerPerson), [usableSqft, selectedUse]);

  return (
    <div className="surface p-6">
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Total square footage
          </label>
          <input
            type="number"
            min={0}
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Use type
          </label>
          <select
            value={useType}
            onChange={(e) => setUseType(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            {USE_TYPES.map((u) => (
              <option key={u.slug} value={u.slug}>
                {u.label} — {u.sqftPerPerson} sf/person
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">{selectedUse.hint}</p>
        </div>
        <div>
          <label className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Usable floor area %
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={usableFactor}
            onChange={(e) => setUsableFactor(Number(e.target.value))}
            className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
          />
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            % of total sqft actually occupiable after stage, bars, lounges, fixed obstructions. 80% is a common default;
            adjust per venue plot.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Estimated capacity
            </div>
            <div className="mt-1 text-[11px] text-[var(--text-muted)]">
              Usable area: {Math.round(usableSqft).toLocaleString()} sf at {selectedUse.sqftPerPerson} sf/person
            </div>
          </div>
          <div className="font-mono text-2xl font-semibold">{occupancy.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4 rounded border border-[var(--border-color)] bg-[var(--surface-inset)] p-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
        Estimate only. Verified capacity depends on egress capacity, sprinkler coverage, fixed seating, and AHJ
        judgement. Confirm before publishing.
      </div>
    </div>
  );
}
