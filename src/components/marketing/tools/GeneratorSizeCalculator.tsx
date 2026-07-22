"use client";

import { useMemo, useState } from "react";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

/**
 * Generator sizing estimator. The demand-factor and power-factor math mirrors
 * standard electrical load-calculation practice; the fuel curve is a MODELED
 * approximation. Nothing here replaces a load schedule stamped by the
 * engineer of record.
 */
const STANDARD_SIZES_KVA = [
  20, 30, 45, 60, 80, 100, 125, 150, 200, 250, 300, 350, 400, 500, 600, 750, 1000, 1250, 1500, 2000,
] as const;

/** MODELED: typical diesel consumption near 0.07 gal per kWh at working loads. */
const GAL_PER_KWH = 0.07;

export function GeneratorSizeCalculator() {
  const fmt = useFormatters();
  const [inputMode, setInputMode] = useState<"kw" | "amps">("kw");
  const [connectedKw, setConnectedKw] = useState(120);
  const [amps, setAmps] = useState(200);
  const [volts, setVolts] = useState(208);
  const [threePhase, setThreePhase] = useState(true);
  const [powerFactor, setPowerFactor] = useState(0.8);
  const [diversity, setDiversity] = useState(0.8);
  const [headroom, setHeadroom] = useState(20);

  const results = useMemo(() => {
    const pf = Math.min(1, Math.max(0.1, powerFactor));
    const df = Math.min(1, Math.max(0.1, diversity));
    const hr = Math.max(0, headroom);
    const loadKw =
      inputMode === "kw"
        ? Math.max(0, connectedKw)
        : (Math.max(0, volts) * Math.max(0, amps) * (threePhase ? Math.sqrt(3) : 1) * pf) / 1000;
    const demandKw = loadKw * df;
    const requiredKva = (demandKw / pf) * (1 + hr / 100);
    const suggested = STANDARD_SIZES_KVA.find((s) => s >= requiredKva) ?? null;
    const loadPct = suggested ? Math.round(((demandKw / pf) / suggested) * 100) : null;
    const galPerHour = demandKw * GAL_PER_KWH;
    return { loadKw, demandKw, requiredKva, suggested, loadPct, galPerHour };
  }, [inputMode, connectedKw, amps, volts, threePhase, powerFactor, diversity, headroom]);

  return (
    <div className="surface p-6">
      <div className="space-y-4">
        <fieldset>
          <legend className="eyebrow">Enter load as</legend>
          <div className="mt-1 flex gap-4 text-sm">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="gen-input-mode"
                checked={inputMode === "kw"}
                onChange={() => setInputMode("kw")}
              />
              Connected kW
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name="gen-input-mode"
                checked={inputMode === "amps"}
                onChange={() => setInputMode("amps")}
              />
              Amps and voltage
            </label>
          </div>
        </fieldset>

        {inputMode === "kw" ? (
          <div>
            <label className="eyebrow" htmlFor="gen-kw">
              Connected load (kW)
            </label>
            <input
              id="gen-kw"
              type="number"
              min={0}
              value={connectedKw}
              onChange={(e) => setConnectedKw(Number(e.target.value))}
              className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              Sum of everything on the load schedule: audio, lighting, video, rigging motors, catering, HVAC.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="eyebrow" htmlFor="gen-amps">
                Amps
              </label>
              <input
                id="gen-amps"
                type="number"
                min={0}
                value={amps}
                onChange={(e) => setAmps(Number(e.target.value))}
                className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="eyebrow" htmlFor="gen-volts">
                Voltage
              </label>
              <input
                id="gen-volts"
                type="number"
                min={0}
                value={volts}
                onChange={(e) => setVolts(Number(e.target.value))}
                className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <span className="eyebrow">Phase</span>
              <label className="mt-2 flex items-center gap-1.5 text-sm" htmlFor="gen-three-phase">
                <input
                  id="gen-three-phase"
                  type="checkbox"
                  checked={threePhase}
                  onChange={(e) => setThreePhase(e.target.checked)}
                />
                Three phase
              </label>
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="eyebrow" htmlFor="gen-pf">
              Power factor
            </label>
            <input
              id="gen-pf"
              type="number"
              min={0.1}
              max={1}
              step={0.05}
              value={powerFactor}
              onChange={(e) => setPowerFactor(Number(e.target.value))}
              className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              Basis: standard genset rating convention. 0.8 is the common default for mixed production loads.
            </p>
          </div>
          <div>
            <label className="eyebrow" htmlFor="gen-diversity">
              Demand / diversity factor
            </label>
            <input
              id="gen-diversity"
              type="number"
              min={0.1}
              max={1}
              step={0.05}
              value={diversity}
              onChange={(e) => setDiversity(Number(e.target.value))}
              className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              Basis: standard load-calculation practice. Not everything draws at once; 0.8 is a MODELED default.
            </p>
          </div>
          <div>
            <label className="eyebrow" htmlFor="gen-headroom">
              Headroom %
            </label>
            <input
              id="gen-headroom"
              type="number"
              min={0}
              max={100}
              value={headroom}
              onChange={(e) => setHeadroom(Number(e.target.value))}
              className="mt-1 w-full rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm"
            />
            <p className="mt-2 text-[11px] text-[var(--p-text-2)]">
              MODELED (rule of thumb): 20 percent covers motor inrush and day-of additions.
            </p>
          </div>
        </div>
      </div>

      <div aria-live="polite" className="mt-6 border-t border-[var(--p-border)] pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">kVA required</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                {fmt.number(Math.round(results.demandKw))} kW demand ({fmt.number(Math.round(results.loadKw))} kW
                connected at {Math.round(Math.min(1, Math.max(0.1, diversity)) * 100)} percent diversity), divided by
                power factor, plus {Math.max(0, headroom)} percent headroom.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{fmt.number(Math.ceil(results.requiredKva))}</div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Suggested generator</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                {results.suggested
                  ? `Next standard rental size up. Runs near ${results.loadPct} percent load.${
                      results.loadPct !== null && results.loadPct < 30
                        ? " Under 30 percent load risks wet stacking on diesel units; consider a smaller set or paralleled units."
                        : ""
                    }`
                  : "Above the largest single standard size here. Spec paralleled units with your power vendor."}
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">
              {results.suggested ? `${fmt.number(results.suggested)} kVA` : "2000+ kVA"}
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Fuel estimate</div>
              <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
                MODELED (rule of thumb): diesel near {GAL_PER_KWH} gal per kWh at working loads. About{" "}
                {fmt.number(Math.round(results.galPerHour * 10))} gal across a 10-hour show day.
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold">{results.galPerHour.toFixed(1)} gal/hr</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 text-[11px] leading-relaxed text-[var(--p-text-2)]">
        This is a planning estimate, and we are not your engineer of record. Temporary power design, feeder sizing,
        grounding, and permitting must be done by a licensed electrician or the engineer of record and accepted by the
        AHJ. Bring this number to that conversation, not in place of it.
      </div>
    </div>
  );
}
