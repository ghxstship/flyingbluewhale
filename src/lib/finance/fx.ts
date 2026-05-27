import "server-only";

import { log } from "@/lib/log";

/**
 * Daily FX rate worker (Round 74 — G-030 / F44).
 *
 * Pulls daily snapshots from Frankfurter (ECB-backed, free, no key) with
 * a fallback to exchangerate.host. Writes into public.exchange_rates
 * with source = 'frankfurter' | 'exchangerate.host'.
 *
 * Activation: no env var required for the primary provider — Frankfurter
 * is open data. Schedule POST /api/v1/integrations/fx/refresh from cron
 * or invoke ad-hoc.
 */

const FRANKFURTER_BASE = "https://api.frankfurter.dev";
const EXCHANGERATE_HOST_BASE = "https://api.exchangerate.host";

export type FxRow = {
  from_currency: string;
  to_currency: string;
  effective_at: string;
  rate: number;
  source: string;
};

const DEFAULT_BASES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN"] as const;
const DEFAULT_QUOTES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "MXN",
  "BRL",
  "INR",
  "ZAR",
  "CHF",
  "SGD",
  "HKD",
] as const;

export async function fetchFrankfurterRates(base: string, date: string): Promise<FxRow[] | { error: string }> {
  const quotes = DEFAULT_QUOTES.filter((q) => q !== base).join(",");
  const url = `${FRANKFURTER_BASE}/${date}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(quotes)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    log.warn("fx.frankfurter_failed", { base, date, status: res.status });
    return { error: `Frankfurter ${res.status}` };
  }
  const json = (await res.json()) as { date: string; base: string; rates: Record<string, number> };
  const effective = new Date(`${json.date}T00:00:00Z`).toISOString();
  return Object.entries(json.rates).map(([to, rate]) => ({
    from_currency: json.base,
    to_currency: to,
    effective_at: effective,
    rate: Number(rate),
    source: "frankfurter",
  }));
}

export async function fetchExchangerateHostRates(base: string, date: string): Promise<FxRow[] | { error: string }> {
  const quotes = DEFAULT_QUOTES.filter((q) => q !== base).join(",");
  const url = `${EXCHANGERATE_HOST_BASE}/${date}?source=${encodeURIComponent(base)}&currencies=${encodeURIComponent(quotes)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { error: `exchangerate.host ${res.status}` };
  const json = (await res.json()) as { date?: string; quotes?: Record<string, number>; rates?: Record<string, number> };
  const ratesRaw = json.quotes ?? json.rates ?? {};
  const effective = new Date(`${json.date ?? date}T00:00:00Z`).toISOString();
  return Object.entries(ratesRaw).map(([k, v]) => {
    const to = k.startsWith(base) ? k.slice(base.length) : k;
    return {
      from_currency: base,
      to_currency: to,
      effective_at: effective,
      rate: Number(v),
      source: "exchangerate.host",
    };
  });
}

/**
 * Pull daily rates for the configured bases. Primary: Frankfurter.
 * Fallback per-base: exchangerate.host.
 */
export async function pullDailyRates(date: string, bases: readonly string[] = DEFAULT_BASES): Promise<FxRow[]> {
  const out: FxRow[] = [];
  for (const base of bases) {
    const primary = await fetchFrankfurterRates(base, date);
    if (!("error" in primary)) {
      out.push(...primary);
      continue;
    }
    const fallback = await fetchExchangerateHostRates(base, date);
    if (!("error" in fallback)) {
      out.push(...fallback);
      continue;
    }
    log.error("fx.pull_failed_both_providers", { base, date });
  }
  return out;
}

/** Cents-aware FX conversion for app-side display. */
export function convertCents(amountCents: number | bigint, rate: number): number {
  return Math.round(Number(amountCents) * rate);
}
