"use client";

import * as React from "react";
import { markerColor } from "@/lib/views/map";

/**
 * Marker chip rendered inside `<MapView>` (Phase 3.6b). Plain DOM —
 * `<MapView>` mounts it via `ReactDOM.createRoot` on a host element it
 * hands to `new maplibregl.Marker({ element })`, so it cannot rely on
 * React context from the surrounding tree.
 *
 * Two flavors:
 * - `count` undefined → solo pin (small filled circle with a 2px ring).
 * - `count` set → cluster bubble (larger, count number inside).
 *
 * The chip uses CSS variables for its tone color so it inherits any
 * `data-platform` brand overlay without further plumbing.
 */
export type MapMarkerProps = {
  tone?: string;
  count?: number;
  title?: string;
  active?: boolean;
};

export function MapMarker({ tone, count, title, active }: MapMarkerProps): React.ReactElement {
  const color = markerColor(tone);
  const isCluster = typeof count === "number" && count > 1;

  if (isCluster) {
    return (
      <div
        className="map-cluster-pin"
        title={title}
        style={{
          background: color,
          color: "var(--p-bg)",
          border: "2px solid var(--p-bg)",
          boxShadow: "var(--p-elev-1, 0 1px 2px rgba(0,0,0,0.2))",
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          cursor: "pointer",
          userSelect: "none",
        }}
        data-active={active ? "true" : undefined}
      >
        {count}
      </div>
    );
  }

  return (
    <div
      className="map-marker-pin"
      title={title}
      style={{
        background: color,
        border: "2px solid var(--p-bg)",
        boxShadow: "var(--p-elev-1, 0 1px 2px rgba(0,0,0,0.2))",
        width: 14,
        height: 14,
        borderRadius: "50%",
        cursor: "pointer",
      }}
      data-active={active ? "true" : undefined}
    />
  );
}
