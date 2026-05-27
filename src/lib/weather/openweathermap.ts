import "server-only";

import { log } from "@/lib/log";
import type { WeatherSnapshot } from "./nws";

/**
 * OpenWeatherMap fallback for non-US sites (gap G-018 follow-up).
 *
 * Activated when OPENWEATHERMAP_API_KEY is set. NWS remains primary
 * inside US territory; this only fires when NWS returns null.
 *
 * Uses the Current Weather endpoint (free tier). For multi-day forecast
 * upgrade to One Call API (paid). We map current observation to the
 * same WeatherSnapshot shape used by NWS.
 */

type OwmCurrent = {
  weather?: Array<{ description?: string; main?: string }>;
  main?: { temp?: number; temp_min?: number; temp_max?: number };
  wind?: { speed?: number };
  rain?: { "1h"?: number; "3h"?: number };
  snow?: { "1h"?: number; "3h"?: number };
  dt?: number;
};

export function openWeatherMapConfigured(): boolean {
  return !!process.env.OPENWEATHERMAP_API_KEY;
}

export async function fetchOwmWeather(lat: number, lon: number): Promise<WeatherSnapshot | null> {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", lat.toFixed(4));
    url.searchParams.set("lon", lon.toFixed(4));
    url.searchParams.set("units", "imperial"); // F + mph, matches our schema
    url.searchParams.set("appid", key);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      log.warn("owm.fetch_failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as OwmCurrent;
    const high = data.main?.temp_max ?? data.main?.temp ?? null;
    const low = data.main?.temp_min ?? data.main?.temp ?? null;
    const wind = data.wind?.speed ?? null;
    const conditions = data.weather?.[0]?.description ?? data.weather?.[0]?.main ?? null;
    const rainIn = (data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0) / 25.4;
    const snowIn = (data.snow?.["1h"] ?? data.snow?.["3h"] ?? 0) / 25.4;
    return {
      temp_high_f: high,
      temp_low_f: low,
      precip_in: Number((rainIn + snowIn).toFixed(2)),
      wind_mph: wind,
      conditions: conditions ? conditions.charAt(0).toUpperCase() + conditions.slice(1) : null,
      source: "openweathermap",
      pulled_at: new Date().toISOString(),
    };
  } catch (e) {
    log.warn("owm.exception", { err: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
