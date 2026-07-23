"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { MapMarker, MapRoute } from "@/components/charts/MapShell";
import { useT } from "@/lib/i18n/LocaleProvider";

// MapShell pulls in maplibre-gl + its CSS, ~280kb gzipped. The dispatch
// route is a tab inside the production console; lazy-loading the map chunk
// keeps the parent route's initial JS small for users who never click here.
// SSR off because maplibre-gl touches `window` at module load.
const MapShell = dynamic(() => import("@/components/charts/MapShell").then((mod) => ({ default: mod.MapShell })), {
  ssr: false,
  loading: () => (
    <div className="surface ps-skel w-full" style={{ height: 420 }} aria-busy="true" aria-label="Loading live map" />
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
  const t = useT();
  const markers: MapMarker[] = [];
  const routes: MapRoute[] = [];

  for (const p of points) {
    // Markers are DOM elements inside MapShell, so theme CSS vars resolve
    // natively; route lines are maplibre canvas paint, where MapShell
    // resolves the same tokens via resolveThemeColor at paint time. One
    // semantic token source drives both.
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
      title={t("console.production.dispatch.live.map.title", undefined, "Live Map")}
      description={t(
        "console.production.dispatch.live.map.description",
        undefined,
        "Origin → destination per active run",
      )}
      markers={markers}
      routes={routes}
      empty={points.length === 0}
      height={420}
    />
  );
}

// CN-12 — semantic theme tokens for markers AND routes. Markers render as
// DOM elements (vars resolve natively); route lines are maplibre canvas
// paint, which MapShell resolves through resolveThemeColor at paint time,
// so both track the live theme/mode from the same tokens.
function statusColor(status: string): string {
  switch (status) {
    case "in_transit":
      return "var(--p-info)";
    case "arrived":
      return "var(--p-success)";
    case "delayed":
      return "var(--p-warning)";
    case "cancelled":
      return "var(--p-danger)";
    default:
      return "var(--p-text-2)";
  }
}
