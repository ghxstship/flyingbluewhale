"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { MapMarker, MapRoute } from "@/components/charts/MapShell";

// MapShell pulls in maplibre-gl + its CSS, ~280kb gzipped. The dispatch
// route is a tab inside the production console; lazy-loading the map chunk
// keeps the parent route's initial JS small for users who never click here.
// SSR off because maplibre-gl touches `window` at module load.
const MapShell = dynamic(() => import("@/components/charts/MapShell").then((m) => ({ default: m.MapShell })), {
  ssr: false,
  loading: () => (
    <div className="surface skeleton w-full" style={{ height: 420 }} aria-busy="true" aria-label="Loading live map" />
  ),
});

export type DispatchPoint = {
  id: string;
  vehicle: string;
  status: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  scheduledDepart: string;
  scheduledArrive: string | null;
  actualDepart: string | null;
  actualArrive: string | null;
};

export function LiveDispatchMap({ points }: { points: DispatchPoint[] }) {
  const markers: MapMarker[] = [];
  const routes: MapRoute[] = [];

  for (const p of points) {
    const tone = statusColor(p.status);
    markers.push({
      id: `${p.id}-origin`,
      lng: p.origin.lng,
      lat: p.origin.lat,
      label: `${p.vehicle} · ${p.origin.name}`,
      color: tone,
    });
    markers.push({
      id: `${p.id}-destination`,
      lng: p.destination.lng,
      lat: p.destination.lat,
      label: `${p.vehicle} → ${p.destination.name}`,
      color: tone,
    });
    routes.push({
      id: p.id,
      coords: [
        [p.origin.lng, p.origin.lat],
        [p.destination.lng, p.destination.lat],
      ],
      color: tone,
      width: 3,
    });
  }

  return (
    <MapShell
      title="Live Map"
      description="Origin → destination per active run"
      markers={markers}
      routes={routes}
      empty={points.length === 0}
      height={420}
    />
  );
}

const STATUS_TOKEN: Record<string, string> = {
  in_transit: "--color-info",
  arrived: "--color-success",
  delayed: "--color-warning",
  cancelled: "--color-error",
};

function statusColor(status: string): string {
  const token = STATUS_TOKEN[status] ?? "--text-muted";
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
