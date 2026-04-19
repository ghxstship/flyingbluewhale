import "server-only";
import { httpFetch } from "@/lib/http";

/**
 * Weather wrapper — Opportunity #6.
 *
 * Open-Meteo, no API key required. Used by the call-sheet generator to
 * stamp tomorrow's forecast on the cover. Returns null on network
 * failure so the call sheet compile never blocks on a flaky forecast.
 */

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

export type Weather = { tempF: number; conditions: string };

// Open-Meteo weather codes → human string. Not exhaustive — covers the
// common forecast categories.
const CODE_TABLE: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Thunderstorm w/ heavy hail",
};

export async function fetchWeather({
  lat,
  lng,
  date,
}: {
  lat: number;
  lng: number;
  date: string; // yyyy-mm-dd
}): Promise<Weather | null> {
  if (process.env.WEATHER_DISABLED) return null;
  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max&temperature_unit=fahrenheit&start_date=${date}&end_date=${date}&timezone=UTC`;
  try {
    const res = await httpFetch(url, { timeoutMs: 3000 });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        weather_code?: number[];
      };
    };
    const tempF = body.daily?.temperature_2m_max?.[0];
    const code = body.daily?.weather_code?.[0];
    if (typeof tempF !== "number" || typeof code !== "number") return null;
    return { tempF: Math.round(tempF), conditions: CODE_TABLE[code] ?? "Forecast unavailable" };
  } catch {
    return null;
  }
}
