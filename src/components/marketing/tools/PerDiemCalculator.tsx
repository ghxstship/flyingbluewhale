"use client";

import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Leg = { id: string; city: string; days: number; rate: number; headcount: number };

const DEFAULT_RATE = 79;

const GSA_TIER_PRESETS: Array<{ label: string; rate: number; hint: string }> = [
  { label: "Standard CONUS", rate: 79, hint: "Most US cities" },
  { label: "Tier 1 Metro", rate: 92, hint: "NYC, SF, LA, Chicago" },
  { label: "Tier 2 Metro", rate: 86, hint: "Major regional cities" },
  { label: "International (avg)", rate: 145, hint: "DSSR baseline" },
];

export function PerDiemCalculator() {
  const [legs, setLegs] = useState<Leg[]>([{ id: "1", city: "", days: 5, rate: DEFAULT_RATE, headcount: 6 }]);

  const total = useMemo(
    () => legs.reduce((sum, l) => sum + Math.max(0, l.days) * Math.max(0, l.rate) * Math.max(0, l.headcount), 0),
    [legs],
  );

  const totalDays = useMemo(() => legs.reduce((sum, l) => sum + Math.max(0, l.days), 0), [legs]);

  const update = (id: string, patch: Partial<Leg>) =>
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const remove = (id: string) => setLegs((prev) => prev.filter((l) => l.id !== id));

  const add = () =>
    setLegs((prev) => [...prev, { id: crypto.randomUUID(), city: "", days: 1, rate: DEFAULT_RATE, headcount: 1 }]);

  return (
    <div className="surface p-6">
      <div className="space-y-4">
        {legs.map((l, idx) => (
          <div key={l.id} className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-inset)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">Leg {idx + 1}</div>
              {legs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--foreground)]"
                  aria-label="Remove leg"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="eyebrow">City / venue</label>
                <input
                  type="text"
                  value={l.city}
                  onChange={(e) => update(l.id, { city: e.target.value })}
                  placeholder="e.g. Las Vegas"
                  className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="eyebrow">Days</label>
                <input
                  type="number"
                  min={0}
                  value={l.days}
                  onChange={(e) => update(l.id, { days: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="eyebrow">Headcount</label>
                <input
                  type="number"
                  min={0}
                  value={l.headcount}
                  onChange={(e) => update(l.id, { headcount: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="eyebrow">Daily rate (USD)</label>
                <input
                  type="number"
                  min={0}
                  value={l.rate}
                  onChange={(e) => update(l.id, { rate: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {GSA_TIER_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => update(l.id, { rate: preset.rate })}
                      className="rounded-full border border-[var(--border-color)] bg-[var(--background)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--foreground)]"
                      title={preset.hint}
                    >
                      {preset.label} ${preset.rate}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="eyebrow">Leg total</label>
                <div className="mt-1 rounded border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 font-mono text-sm">
                  ${(Math.max(0, l.days) * Math.max(0, l.rate) * Math.max(0, l.headcount)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        <Button type="button" onClick={add} variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
          <Plus size={14} aria-hidden="true" /> Add leg
        </Button>
      </div>

      <div className="mt-6 border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">Total</div>
            <div className="mt-1 text-[10px] text-[var(--text-muted)]">
              {totalDays} crew-days across {legs.length} leg{legs.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="font-mono text-2xl font-semibold">${total.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
