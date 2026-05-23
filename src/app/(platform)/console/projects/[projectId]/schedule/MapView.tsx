"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

export type MapPin = {
  id: string;
  name: string;
  locationName: string | null;
  when: string;
};

/**
 * Location-grouped event list (placeholder for a real map renderer).
 * Renders each unique location_id as a card with the events anchored there.
 * Upgrade path: swap the card list for a Mapbox/Leaflet renderer once we
 * add a venue lat/lng surface.
 */
export function MapView({ pins }: { pins: MapPin[] }) {
  if (pins.length === 0) {
    return (
      <div className="surface p-6 text-sm text-[var(--text-muted)]">
        No Events Carry A Location Yet. Set <strong>location_id</strong> on an event to map it.
      </div>
    );
  }
  const byLocation = new Map<string, MapPin[]>();
  for (const p of pins) {
    const k = p.locationName ?? "Unassigned";
    const list = byLocation.get(k) ?? [];
    list.push(p);
    byLocation.set(k, list);
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from(byLocation.entries()).map(([loc, items]) => (
        <div key={loc} className="surface rounded-md p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MapPin size={14} className="text-[var(--org-primary)]" aria-hidden />
            {loc}
            <span className="ms-auto font-mono text-[10px] text-[var(--text-muted)]">{items.length}</span>
          </div>
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.id}>
                <Link href={`/console/events/${it.id}`} className="block text-xs hover:underline">
                  <span className="font-medium">{it.name}</span>{" "}
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">{it.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
