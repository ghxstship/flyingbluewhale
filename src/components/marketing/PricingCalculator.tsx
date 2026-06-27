"use client";

import { useMemo, useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * `<PricingCalculator>` — total-cost-of-ownership calculator for /pricing.
 *
 * Three inputs drive the math: shows per year, crew size at peak, current
 * monthly stack spend. The calculator computes:
 *   - Annual ATLVS Production tier ($199 / mo × 12 = $2,388)
 *   - Annual current-stack spend (input × 12)
 *   - Per-show cost on each side, divided by shows-per-year
 *
 * Stack assumption: most production teams in 2026 carry ~5-8 SaaS line
 * items (project mgmt + e-sig + scheduling + accounting + storage + portal
 * + comms) plus per-seat overhead. The default $1,400/mo input matches
 * the median we see in onboarding calls — Asana Business + Eventbrite +
 * DocuSign + QuickBooks + Dropbox Business + Slack + per-vendor PO tool.
 *
 * Math is deliberately conservative: doesn't claim integration tax, doesn't
 * count seat-explosion overruns, doesn't price the AI replacement. Operator
 * still sees a 5-10× cost gap on a typical festival-tier op.
 */
const ATLVS_PRODUCTION_ANNUAL = 199 * 12; // $2,388/yr

function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function PricingCalculator() {
  const t = useT();
  const [shows, setShows] = useState(12);
  const [crew, setCrew] = useState(25);
  const [stackMonthly, setStackMonthly] = useState(1400);

  const numbers = useMemo(() => {
    const stackAnnual = stackMonthly * 12;
    const savings = Math.max(0, stackAnnual - ATLVS_PRODUCTION_ANNUAL);
    const showsSafe = Math.max(1, shows);
    return {
      stackAnnual,
      atlvsAnnual: ATLVS_PRODUCTION_ANNUAL,
      savings,
      stackPerShow: stackAnnual / showsSafe,
      atlvsPerShow: ATLVS_PRODUCTION_ANNUAL / showsSafe,
      multiple: ATLVS_PRODUCTION_ANNUAL > 0 ? stackAnnual / ATLVS_PRODUCTION_ANNUAL : 0,
    };
  }, [shows, stackMonthly]);

  return (
    <div className="surface relative overflow-hidden p-8 md:p-10">
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: "linear-gradient(90deg, var(--p-accent), var(--p-accent-text))" }}
        aria-hidden
      />
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div>
          <div className="eyebrow eyebrow-accent flex items-center gap-2">
            <Calculator size={12} aria-hidden />{" "}
            {t("marketing.pricingCalculator.eyebrow", undefined, "What it actually costs")}
          </div>
          <h2 className="hed-xl mt-3">
            {t("marketing.pricingCalculator.heading", undefined, "Run the math.")}
          </h2>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pricingCalculator.intro",
              undefined,
              "Plug in shows per year, crew at peak, and what you spend monthly on the fragmented stack. We’ll show you annual spend and per-show cost on both sides. Math is conservative — no integration tax, no per-seat overruns counted.",
            )}
          </p>

          <div className="mt-6 space-y-5">
            <Field
              label={t("marketing.pricingCalculator.showsPerYear", undefined, "Shows per year")}
              value={shows}
              onChange={setShows}
              min={1}
              max={60}
              step={1}
              suffix={
                shows === 1
                  ? t("marketing.pricingCalculator.showOne", undefined, "show")
                  : t("marketing.pricingCalculator.showMany", undefined, "shows")
              }
            />
            <Field
              label={t("marketing.pricingCalculator.crewAtPeak", undefined, "Crew at peak")}
              value={crew}
              onChange={setCrew}
              min={1}
              max={500}
              step={1}
              suffix={
                crew === 1
                  ? t("marketing.pricingCalculator.personOne", undefined, "person")
                  : t("marketing.pricingCalculator.personMany", undefined, "people")
              }
            />
            <Field
              label={t("marketing.pricingCalculator.stackMonthly", undefined, "Current stack — monthly")}
              value={stackMonthly}
              onChange={setStackMonthly}
              min={0}
              max={10000}
              step={50}
              prefix="$"
              suffix={t("marketing.pricingCalculator.perMo", undefined, "/ mo")}
            />
          </div>
          <p className="mt-5 font-mono text-[11px] tracking-wide text-[var(--p-text-2)] uppercase">
            {t(
              "marketing.pricingCalculator.stackNote",
              undefined,
              "Default $1,400/mo = Asana + Eventbrite + DocuSign + QuickBooks + Dropbox + Slack + PO tool.",
            )}
          </p>
        </div>

        <div className="surface-terminal p-6">
          <div className="flex items-center justify-between border-b border-[var(--p-border)] pb-3">
            <span className="term-prompt">$</span>
            <span className="term-dim flex-1">
              atlvs estimate --shows {shows} --crew {crew}
            </span>
            <span className="term-ok">● ok</span>
          </div>

          <dl className="mt-4 space-y-3">
            <Row
              label={t("marketing.pricingCalculator.stackAnnual", undefined, "Current stack — annual")}
              value={formatUsd(numbers.stackAnnual)}
              tone="dim"
            />
            <Row
              label={t("marketing.pricingCalculator.atlvsAnnual", undefined, "ATLVS Production — annual")}
              value={formatUsd(numbers.atlvsAnnual)}
              tone="accent"
            />
            <Row
              label={t("marketing.pricingCalculator.annualSavings", undefined, "Annual savings")}
              value={formatUsd(numbers.savings)}
              tone="ok"
              emphasize
            />
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--p-border)] pt-4">
            <Tile
              label={t("marketing.pricingCalculator.currentPerShow", undefined, "Current per show")}
              value={formatUsd(numbers.stackPerShow)}
            />
            <Tile
              label={t("marketing.pricingCalculator.atlvsPerShow", undefined, "ATLVS per show")}
              value={formatUsd(numbers.atlvsPerShow)}
              tone="accent"
            />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[var(--p-border)] pt-4">
            <div className="font-mono text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">
              {t("marketing.pricingCalculator.ratio", undefined, "Stack ÷ ATLVS")}
            </div>
            <div className="font-mono text-2xl font-semibold text-[var(--p-accent)]">
              {numbers.multiple > 0 ? `${numbers.multiple.toFixed(1)}×` : "—"}
            </div>
          </div>

          <a
            href="/signup"
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs font-semibold text-[var(--p-accent-text)] underline underline-offset-4"
          >
            {t("marketing.pricingCalculator.signUpFree", undefined, "Sign up free")}{" "}
            <ArrowRight size={12} className="cta-nudge" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold tracking-tight">{label}</label>
        <div className="font-mono text-sm tabular-nums">
          {prefix}
          {value.toLocaleString()}
          {suffix && <span className="ms-1 text-[var(--p-text-2)]">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        aria-label={label}
        className="mt-2 w-full accent-[var(--p-accent)]"
      />
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  emphasize,
}: {
  label: string;
  value: string;
  tone?: "dim" | "ok" | "accent";
  emphasize?: boolean;
}) {
  const toneClass = tone === "dim" ? "term-dim" : tone === "ok" ? "term-ok" : tone === "accent" ? "term-accent" : "";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={`font-mono text-[11px] tracking-wide uppercase ${tone === "dim" ? "term-dim" : ""}`}>{label}</dt>
      <dd className={`font-mono tabular-nums ${emphasize ? "text-2xl font-semibold" : "text-base"} ${toneClass}`}>
        {value}
      </dd>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "accent" }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-wide text-[var(--p-text-2)] uppercase">{label}</div>
      <div
        className={`mt-1 font-mono tabular-nums ${tone === "accent" ? "text-[var(--p-accent-text)]" : ""} text-lg font-semibold`}
      >
        {value}
      </div>
    </div>
  );
}
