"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * World clocks row (kit 20 fixture 01) — the ops-center strip under the
 * Home hero. Cities and labels come from the kit registry (`clocks`);
 * times are computed client-side against real IANA timezones.
 *
 * Hydration-safe per the React #418 canon: the server render shows a
 * stable placeholder; the tick starts in an effect (never Date.now()
 * during render).
 */

const CLOCKS = [
  { city: "Miami", label: "Production HQ", tz: "America/New_York" },
  { city: "Chicago", label: "Central Ops", tz: "America/Chicago" },
  { city: "Denver", label: "Mountain Ops", tz: "America/Denver" },
  { city: "Los Angeles", label: "West Coast Studio", tz: "America/Los_Angeles" },
] as const;

function partsIn(tz: string, now: Date): { h: number; m: number; s: number; text: string } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value ?? "";
  const h = get("hour");
  const m = get("minute");
  const s = get("second");
  return { h: h % 12, m, s, text: `${h}:${String(m).padStart(2, "0")} ${dayPeriod}` };
}

function AnalogClock({ h, m, s }: { h: number; m: number; s: number }) {
  const hourA = (h + m / 60) * 30;
  const minA = m * 6;
  const secA = s * 6;
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="var(--p-surface)" stroke="var(--p-border)" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="24"
          y1="4.5"
          x2="24"
          y2="7"
          stroke="var(--p-text-3)"
          strokeWidth="1.5"
          transform={`rotate(${i * 30} 24 24)`}
        />
      ))}
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="14"
        stroke="var(--p-text-1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${hourA} 24 24)`}
      />
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="9"
        stroke="var(--p-text-1)"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${minA} 24 24)`}
      />
      <line
        x1="24"
        y1="26"
        x2="24"
        y2="8"
        stroke="var(--p-accent)"
        strokeWidth="1"
        strokeLinecap="round"
        transform={`rotate(${secA} 24 24)`}
      />
      <circle cx="24" cy="24" r="1.5" fill="var(--p-accent)" />
    </svg>
  );
}

export function WorldClocks() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CLOCKS.map((c) => {
        const p = now ? partsIn(c.tz, now) : null;
        return (
          <div key={c.city} className="surface flex items-center gap-4 p-4">
            {p ? <AnalogClock h={p.h} m={p.m} s={p.s} /> : <Skeleton className="shrink-0" width={48} height={48} radius="var(--p-r-pill)" />}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{c.city}</div>
              <div className="font-mono text-lg tabular-nums" suppressHydrationWarning>
                {p?.text ?? "--:--"}
              </div>
              <div className="eyebrow truncate">{c.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
