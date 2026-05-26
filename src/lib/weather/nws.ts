import "server-only";

import { log } from "@/lib/log";

/**
 * NWS (US National Weather Service) auto-pull — gap G-018 runtime.
 *
 * Free, no API key, US-only. For non-US sites we'll fall back to
 * OpenWeatherMap later (env-gated).
 *
 * Two-step protocol:
 *   1. GET https://api.weather.gov/points/{lat},{lon} → returns metadata
 *      including the `forecastHourly` URL for that grid cell.
 *   2. GET that URL → array of periods with temp/wind/conditions.
 *
 * Requires a User-Agent header per NWS terms. Cache key is (lat,lon,day).
 */

const USER_AGENT = "(atlvs.pro, ops@atlvs.pro)";

export type WeatherSnapshot = {
  temp_high_f: number | null;
  temp_low_f: number | null;
  precip_in: number | null;
  wind_mph: number | null;
  conditions: string | null;
  source: "nws" | "openweathermap" | "manual";
  pulled_at: string;
};

type NwsPointsResp = {
  properties?: {
    forecast?: string;
    forecastHourly?: string;
    relativeLocation?: { properties?: { city?: string; state?: string } };
  };
};

type NwsForecastResp = {
  properties?: {
    periods?: Array<{
      startTime: string;
      endTime: string;
      temperature: number;
      temperatureUnit: "F" | "C";
      probabilityOfPrecipitation?: { value: number | null };
      windSpeed?: string; // "10 mph"
      shortForecast?: string;
      isDaytime?: boolean;
    }>;
  };
};

function parseWindMph(s: string | undefined): number | null {
  if (!s) return null;
  const match = s.match(/(\d+)\s*mph/i);
  return match ? Number(match[1]) : null;
}

/**
 * Pull a one-day forecast for the given coordinates on the given date.
 * Date format YYYY-MM-DD. Returns null if NWS is unavailable or the
 * coordinates are outside US territory.
 */
export async function fetchNwsWeather(lat: number, lon: number, date: string): Promise<WeatherSnapshot | null> {
  try {
    const pointsRes = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      cache: "no-store",
    });
    if (!pointsRes.ok) {
      log.warn("nws.points_failed", { lat, lon, status: pointsRes.status });
      return null;
    }
    const points = (await pointsRes.json()) as NwsPointsResp;
    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) return null;

    const fcRes = await fetch(forecastUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      cache: "no-store",
    });
    if (!fcRes.ok) {
      log.warn("nws.forecast_failed", { url: forecastUrl, status: fcRes.status });
      return null;
    }
    const fc = (await fcRes.json()) as NwsForecastResp;

    const periods = fc.properties?.periods ?? [];
    // Find periods that overlap the target date.
    const dayPeriods = periods.filter((p) => p.startTime.startsWith(date));
    if (dayPeriods.length === 0) {
      // If the date is in the past (more than 7 days), NWS doesn't return it —
      // bail.
      return null;
    }

    let temp_high_f: number | null = null;
    let temp_low_f: number | null = null;
    let conditions: string | null = null;
    let wind_mph: number | null = null;
    let maxPrecipProb = 0;

    for (const p of dayPeriods) {
      const tempF = p.temperatureUnit === "F" ? p.temperature : Math.round((p.temperature * 9) / 5 + 32);
      if (temp_high_f === null || tempF > temp_high_f) temp_high_f = tempF;
      if (temp_low_f === null || tempF < temp_low_f) temp_low_f = tempF;
      const w = parseWindMph(p.windSpeed);
      if (w != null && (wind_mph === null || w > wind_mph)) wind_mph = w;
      const prob = p.probabilityOfPrecipitation?.value ?? 0;
      if (prob > maxPrecipProb) maxPrecipProb = prob;
      if (!conditions && p.isDaytime !== false) conditions = p.shortForecast ?? null;
    }

    // NWS gives precip *probability* (%), not inches. Convert to a rough
    // expected-inches estimate so we have something to file; real inches
    // come from observation, not forecast.
    const precip_in = maxPrecipProb > 0 ? Number((maxPrecipProb / 100).toFixed(2)) : 0;

    return {
      temp_high_f,
      temp_low_f,
      precip_in,
      wind_mph,
      conditions,
      source: "nws",
      pulled_at: new Date().toISOString(),
    };
  } catch (e) {
    log.warn("nws.exception", { err: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
