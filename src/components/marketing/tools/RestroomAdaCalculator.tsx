"use client";

import { useMemo, useState } from "react";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

/**
 * Portable restroom and ADA count estimator. The base table is the MODELED
 * industry sizing practice for portable units (the fixture-count methodology
 * derives from IPC 403.1 for permanent occupancies); the accessible count is
 * DERIVED from the 2010 ADA Standards section 213 (5 percent of units,
 * minimum 1 per cluster).
 */
const GENDER_SPLITS: Array<{ slug: string; label: string; factor: number; hint: string }> = [
  {
    slug: "balanced",
    label: "Roughly balanced",
    factor: 1,
    hint: "No adjustment.",
  },
  {
    slug: "majority-women",
    label: "Majority women",
    factor: 1.1,
    hint: "MODELED (rule of thumb): add 10 percent of units to keep queue times even.",
  },
  {
    slug: "majority-men",
    label: "Majority men",
    factor: 1,
    hint: "No adjustment.",
  },
];

function durationFactor(hours: number): number {
  if (hours <= 4) return 1;
  if (hours <= 6) return 1.25;
  if (hours <= 8) return 1.5;
  if (hours <= 10) return 1.75;
  return 2;
}

export function RestroomAdaCalculator() {
  const fmt = useFormatters();
  const [attendance, setAttendance] = useState(5000);
  const [hours, setHours] = useState(6);
  const [alcohol, setAlcohol] = useState(true);
  const [split, setSplit] = useState(GENDER_SPLITS[0]!.slug);

  const selectedSplit = GENDER_SPLITS.find((s) => s.slug === split) ?? GENDER_SPLITS[0]!;

  const results = useMemo(() => {
    const att = Math.max(0, attendance);
    const hrs = Math.max(0, hours);
    const base = att / 100;
    const factored = base * durationFactor(hrs) * (alcohol ? 1.2 : 1) * selectedSplit.factor;
    const totalUnits = Math.max(2, Math.ceil(factored));
    const adaUnits = Math.max(1, Math.ceil(totalUnits * 0.05));
    const handwash = Math.max(1, Math.ceil(totalUnits / 10));
    return { totalUnits, adaUnits, handwash };
  }, [attendance, hours, alcohol, selectedSplit]);

  return (
    <div className="surface p-6">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="eyebrow" htmlFor="restroom-attendance">
              Expected attendance
            </label>
            <input
              id="restroom-attendance"
              type="number"
              min={0}
              value={attendance}
              onChange={(e) => setAttendance(Number(e.target.value))}
              className="ps-input mt-1 w-full"
            />
          </div>
          <div>
            <label className="eyebrow" htmlFor="restroom-hours">
              Event duration (hours)
            </label>
            <input
              id="restroom-hours"
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="ps-input mt-1 w-full"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              The base table assumes a 4-hour event; longer events scale up to 2x at 10+ hours.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="eyebrow" htmlFor="restroom-split">
              Gender split assumption
            </label>
            <select
              id="restroom-split"
              value={split}
              onChange={(e) => setSplit(e.target.value)}
              className="ps-input mt-1 w-full"
            >
              {GENDER_SPLITS.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">{selectedSplit.hint}</p>
          </div>
          <div>
            <span className="eyebrow">Alcohol</span>
            <label className="mt-2 flex items-center gap-1.5 text-sm" htmlFor="restroom-alcohol">
              <input
                id="restroom-alcohol"
                type="checkbox"
                checked={alcohol}
                onChange={(e) => setAlcohol(e.target.checked)}
              />
              Alcohol is served
            </label>
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              MODELED (rule of thumb): add 20 percent of units when alcohol is served.
            </p>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="mt-6 border-t border-[var(--p-border)] pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Portable units</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                MODELED (rule of thumb): 1 unit per 100 attendees for a 4-hour event, scaled by duration
                {alcohol ? ", plus 20 percent for alcohol" : ""}. The fixture-count methodology derives from IPC 403.1.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(results.totalUnits)}</div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">ADA-accessible units</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                DERIVED from 2010 ADA Standards section 213: at least 5 percent of units, minimum 1 per cluster.
                Distribute them across every cluster, not pooled at one gate.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(results.adaUnits)}</div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Handwash stations</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                MODELED (rule of thumb): 1 station per 10 portable units, minimum 1. Health departments often set
                their own minimum where food is served.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(results.handwash)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 text-[11px] leading-relaxed text-[var(--p-text-2)]">
        Planning estimate only. Permit counts are set by the local health department and the AHJ, and permanent-venue
        fixture counts follow the adopted plumbing code (IPC 403.1 or local amendment). Confirm both before the order
        goes in.
      </div>
    </div>
  );
}
