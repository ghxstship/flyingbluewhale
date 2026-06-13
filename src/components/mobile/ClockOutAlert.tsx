"use client";

import { useEffect, useState } from "react";
import type { ClockStatusEntry } from "@/app/api/v1/workforce/clock-status/route";

function fmt(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function ClockOutAlert() {
  const [entries, setEntries] = useState<ClockStatusEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/v1/workforce/clock-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staleThresholdMinutes: 480 }),
    })
      .then((r) => r.json())
      .then((json: { ok: boolean; data?: { needsClockOut: ClockStatusEntry[] } }) => {
        if (json.ok && json.data) setEntries(json.data.needsClockOut);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--p-warning)] bg-[color-mix(in_srgb,var(--p-warning)_10%,transparent)] p-3 mb-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--p-warning)]">
        <span>⏰</span>
        <span>
          {entries.length} {entries.length === 1 ? "person needs" : "people need"} to clock out
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {entries.slice(0, 5).map((e) => (
          <li key={e.userId} className="flex items-center justify-between text-xs">
            <span className="truncate text-[var(--p-text-1)]">{e.name ?? e.email}</span>
            <span className="ml-2 font-mono text-[var(--p-text-2)] shrink-0">{fmt(e.minutesElapsed)}</span>
          </li>
        ))}
        {entries.length > 5 && (
          <li className="text-xs text-[var(--p-text-2)]">+{entries.length - 5} more</li>
        )}
      </ul>
    </div>
  );
}
