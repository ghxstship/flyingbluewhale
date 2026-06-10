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
  const [useType, setUseType] = useState(USE_TYPES[0]!.slug);
  const [usableFactor, setUsableFactor] = useState(80);

  const selectedUse = USE_TYPES.find((u) => u.slug === useType) ?? USE_TYPES[0]!;

  const usableSqft = useMemo(() => Math.max(0, sqft) * (Math.max(0, usableFactor) / 100), [sqft, usableFactor]);
  const occupancy = useMemo(() => Math.floor(usableSqft / selectedUse.sqftPerPerson), [usableSqft, selectedUse]);

  return (
    <div className="surface p-6">
      <div className="space-y-4">
        <div>
          <label className="eyebrow">Total square footage</label>
          <input
            type="number"
            min={0}
            value={sqft}
            onChange={(e) => setSqft(Number(e.target.value))}
            className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="eyebrow">Use type</label>
          <select
            value={useType}
            onChange={(e) => setUseType(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
          >
            {USE_TYPES.map((u) => (
              <option key={u.slug} value={u.slug}>
                {u.label} — {u.sqftPerPerson} sf/person
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] text-[var(--p-text-2)]">{selectedUse.hint}</p>
        </div>
        <div>
          <label className="eyebrow">Usable floor area %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={usableFactor}
            onChange={(e) => setUsableFactor(Number(e.target.value))}
            className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
          />
          <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
            % of total sqft actually occupiable after stage, bars, lounges, fixed obstructions. 80% is a common default;
            adjust per venue plot.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--p-border)] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Estimated capacity</div>
            <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
              Usable area: {Math.round(usableSqft).toLocaleString()} sf at {selectedUse.sqftPerPerson} sf/person
            </div>
          </div>
          <div className="font-mono text-2xl font-semibold">{occupancy.toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4 rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 text-[11px] leading-relaxed text-[var(--p-text-2)]">
        Estimate only. Verified capacity depends on egress capacity, sprinkler coverage, fixed seating, and AHJ
        judgement. Confirm before publishing.
      </div>
    </div>
  );
}
