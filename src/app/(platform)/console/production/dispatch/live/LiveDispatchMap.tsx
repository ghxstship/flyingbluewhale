"use client";

import * as React from "react";
import { MapShell, type MapMarker, type MapRoute } from "@/components/charts/MapShell";

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
      title="Live map"
      description="Origin → destination per active run"
      markers={markers}
      routes={routes}
      empty={points.length === 0}
      height={420}
    />
  );
}

function statusColor(status: string): string {
  switch (status) {
    case "in_transit":
      return "#3b82f6";
    case "arrived":
      return "#22c55e";
    case "delayed":
      return "#f59e0b";
    case "cancelled":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}
