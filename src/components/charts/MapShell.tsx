"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ChartShell } from "./ChartShell";

export type MapMarker = {
  id: string;
  lng: number;
  lat: number;
  /** Optional inline label for the marker (e.g. truck name). */
  label?: string;
  /** CSS-var-friendly color string, e.g. "var(--org-primary)" or "#22c55e". */
  color?: string;
  /** Optional click handler. */
  onClick?: (marker: MapMarker) => void;
};

export type MapRoute = {
  id: string;
  /** [lng,lat] pairs forming the polyline. */
  coords: Array<[number, number]>;
  color?: string;
  width?: number;
};

/**
 * MapShell — light maplibre-gl wrapper that fits the design system.
 * Uses MapLibre's free demo style by default; pass `styleUrl` to swap
 * in your own (Mapbox / Maptiler / self-hosted). Renders inside a
 * ChartShell so loading / empty / error states match the rest of the
 * dashboard surface.
 */
export function MapShell({
  title,
  description,
  markers = [],
  routes = [],
  initialCenter,
  initialZoom = 9,
  styleUrl = "https://demotiles.maplibre.org/style.json",
  height = 360,
  loading,
  error,
  empty,
}: {
  title?: string;
  description?: string;
  markers?: MapMarker[];
  routes?: MapRoute[];
  initialCenter?: [number, number];
  initialZoom?: number;
  styleUrl?: string;
  height?: number;
  loading?: boolean;
  error?: Error | string | null;
  empty?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRefs = React.useRef<maplibregl.Marker[]>([]);

  // Auto-fit center: prefer first marker, then first route point, then NYC.
  const center: [number, number] =
    initialCenter ??
    (markers[0] ? [markers[0].lng, markers[0].lat] : routes[0]?.coords[0] ?? [-74.006, 40.7128]);

  // Init once.
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom: initialZoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers whenever they change.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((m) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", m.label ?? "Map marker");
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        border: 2px solid white; box-shadow: 0 1px 2px rgba(0,0,0,0.4);
        background: ${m.color ?? "var(--org-primary)"};
        cursor: pointer;
      `;
      if (m.onClick) el.addEventListener("click", () => m.onClick!(m));
      const marker = new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]);
      if (m.label) {
        marker.setPopup(new maplibregl.Popup({ offset: 12, closeButton: false }).setText(m.label));
      }
      marker.addTo(map);
      return marker;
    });
  }, [markers]);

  // Render routes as a single GeoJSON source per route id.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      // Clean previous route layers
      const style = map.getStyle();
      const existing = (style?.layers ?? []).filter((l) => l.id.startsWith("route-"));
      existing.forEach((l) => {
        if (map.getLayer(l.id)) map.removeLayer(l.id);
        if (map.getSource(l.id)) map.removeSource(l.id);
      });
      routes.forEach((r) => {
        const id = `route-${r.id}`;
        map.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: r.coords },
          },
        });
        map.addLayer({
          id,
          type: "line",
          source: id,
          paint: {
            "line-color": r.color ?? "#3b82f6",
            "line-width": r.width ?? 3,
          },
        });
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [routes]);

  return (
    <ChartShell
      title={title}
      description={description}
      loading={loading}
      error={error}
      empty={empty && markers.length === 0 && routes.length === 0}
      height={height}
    >
      <div ref={containerRef} style={{ width: "100%", height }} />
    </ChartShell>
  );
}
