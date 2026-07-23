"use client";

import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";

type Leg = { id: string; city: string; days: number; rate: number; headcount: number };

const DEFAULT_RATE = 79;

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

function gsaTierPresets(t: Translator): Array<{ label: string; rate: number; hint: string }> {
  return [
    {
      label: t("marketing.perDiemCalculator.presets.standardLabel", undefined, "Standard CONUS"),
      rate: 79,
      hint: t("marketing.perDiemCalculator.presets.standardHint", undefined, "Most US cities"),
    },
    {
      label: t("marketing.perDiemCalculator.presets.tier1Label", undefined, "Tier 1 Metro"),
      rate: 92,
      hint: t("marketing.perDiemCalculator.presets.tier1Hint", undefined, "NYC, SF, LA, Chicago"),
    },
    {
      label: t("marketing.perDiemCalculator.presets.tier2Label", undefined, "Tier 2 Metro"),
      rate: 86,
      hint: t("marketing.perDiemCalculator.presets.tier2Hint", undefined, "Major regional cities"),
    },
    {
      label: t("marketing.perDiemCalculator.presets.intlLabel", undefined, "International average"),
      rate: 145,
      hint: t("marketing.perDiemCalculator.presets.intlHint", undefined, "DSSR baseline"),
    },
  ];
}

export function PerDiemCalculator() {
  const t = useT();
  const fmt = useFormatters();
  const GSA_TIER_PRESETS = gsaTierPresets(t);
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
          <div key={l.id} className="rounded-lg border border-[var(--p-border)] bg-[var(--p-surface-2)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="eyebrow">{t("marketing.perDiemCalculator.leg", { n: idx + 1 }, `Leg ${idx + 1}`)}</div>
              {legs.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
                  aria-label={t("marketing.perDiemCalculator.removeLeg", undefined, "Remove leg")}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="eyebrow">
                  {t("marketing.perDiemCalculator.cityVenue", undefined, "City / venue")}
                </label>
                <input
                  type="text"
                  value={l.city}
                  onChange={(e) => update(l.id, { city: e.target.value })}
                  placeholder={t("marketing.perDiemCalculator.cityPlaceholder", undefined, "e.g. Las Vegas")}
                  className="ps-input mt-1 w-full"
                />
              </div>
              <div>
                <label className="eyebrow">{t("marketing.perDiemCalculator.days", undefined, "Days")}</label>
                <input
                  type="number"
                  min={0}
                  value={l.days}
                  onChange={(e) => update(l.id, { days: Number(e.target.value) })}
                  className="ps-input mt-1 w-full"
                />
              </div>
              <div>
                <label className="eyebrow">{t("marketing.perDiemCalculator.headcount", undefined, "Headcount")}</label>
                <input
                  type="number"
                  min={0}
                  value={l.headcount}
                  onChange={(e) => update(l.id, { headcount: Number(e.target.value) })}
                  className="ps-input mt-1 w-full"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="eyebrow">
                  {t("marketing.perDiemCalculator.dailyRate", undefined, "Daily Rate (USD)")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={l.rate}
                  onChange={(e) => update(l.id, { rate: Number(e.target.value) })}
                  className="ps-input mt-1 w-full"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {GSA_TIER_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => update(l.id, { rate: preset.rate })}
                      className="rounded-full border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
                      title={preset.hint}
                    >
                      {preset.label} ${preset.rate}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="eyebrow">{t("marketing.perDiemCalculator.legTotal", undefined, "Leg total")}</label>
                <div className="mt-1 rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 font-mono text-sm">
                  ${fmt.number(Math.max(0, l.days) * Math.max(0, l.rate) * Math.max(0, l.headcount))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="ps-btn ps-btn--ghost ps-btn--sm inline-flex items-center gap-1.5"
        >
          <Plus size={14} aria-hidden="true" /> {t("marketing.perDiemCalculator.addLeg", undefined, "Add leg")}
        </button>
      </div>

      <div className="mt-6 border-t border-[var(--p-border)] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="eyebrow">{t("marketing.perDiemCalculator.total", undefined, "Total")}</div>
            <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
              {legs.length === 1
                ? t(
                    "marketing.perDiemCalculator.summaryOne",
                    { days: totalDays, legs: legs.length },
                    `${totalDays} crew-days across ${legs.length} leg`,
                  )
                : t(
                    "marketing.perDiemCalculator.summaryMany",
                    { days: totalDays, legs: legs.length },
                    `${totalDays} crew-days across ${legs.length} legs`,
                  )}
            </div>
          </div>
          <div className="font-mono text-2xl font-semibold">${fmt.number(total)}</div>
        </div>
      </div>
    </div>
  );
}
