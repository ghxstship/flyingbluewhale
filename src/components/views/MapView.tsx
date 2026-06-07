"use client";

/**
 * <MapView> — config-driven map renderer (Phase 3.6b of the SmartSuite
 * parity roadmap, recommendation in §2 view matrix). Lifts the
 * dispatch-bespoke MapShell pattern into a generic primitive that can
 * consume any address-bearing or lat/lng-bearing table:
 *
 *     <MapView markers={venues} legend onMarkerClick={open} />
 *
 * Per the SmartSuite Map View doc, this primitive renders a
 * maplibre-gl map with marker pins, a tone-coded legend, popup details
 * + simple distance-based clustering when zoomed out.
 *
 * NOTE on `LiveDispatchMap` (`src/app/(platform)/console/production/
 * dispatch/live/LiveDispatchMap.tsx`): that component still routes
 * through `MapShell` because it also needs route polylines (origin →
 * destination), which `<MapView>` deliberately does not handle yet.
 * We keep that production path untouched and let `<MapView>` be the
 * new generic for marker-only cases. A future phase can fold
 * polyline support in here.
 *
 * "use client" because maplibre-gl needs the DOM.
 */

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createRoot, type Root } from "react-dom/client";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapMarker as MapMarkerChip } from "./MapMarker";
import { bounds, clusterMarkers, markerColor } from "@/lib/views/map";

/** Tone keywords supported by the legend + marker chips. */
export type MapMarkerTone = "info" | "warn" | "error" | "success" | "neutral" | "accent";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  /** Tone for marker color. */
  tone?: MapMarkerTone;
  /** Optional content to render in the popup. Plain text or React. */
  popup?: React.ReactNode;
  /** Optional URL to open on click instead of popup. */
  href?: string;
  /** Optional data for caller callbacks. */
  data?: Record<string, unknown>;
};

export type MapViewProps = {
  markers: MapMarker[];
  /** Initial center [lng, lat]. Default: derived from markers' bounding box. */
  initialCenter?: [number, number];
  /** Initial zoom. Default: derived to fit all markers. */
  initialZoom?: number;
  /** Map style URL. Default OpenStreetMap demo style. */
  styleUrl?: string;
  /** Cluster nearby markers below this zoom level. Default 12. */
  clusterAtZoom?: number;
  /** Optional click handler (overrides marker.href). */
  onMarkerClick?: (marker: MapMarker) => void;
  /** Show legend with tone counts. Default true. */
  legend?: boolean;
  /** Container height. Default 480. */
  height?: number;
  className?: string;
};

const DEFAULT_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const TONE_LABELS: Record<MapMarkerTone, string> = {
  info: "Info",
  warn: "Warning",
  error: "Error",
  success: "Success",
  neutral: "Neutral",
  accent: "Accent",
};

type MountedMarker = {
  marker: maplibregl.Marker;
  root: Root;
  el: HTMLDivElement;
};

export function MapView({
  markers,
  initialCenter,
  initialZoom,
  styleUrl = DEFAULT_STYLE_URL,
  clusterAtZoom = 12,
  onMarkerClick,
  legend = true,
  height = 480,
  className,
}: MapViewProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRefs = React.useRef<MountedMarker[]>([]);
  const popupRef = React.useRef<maplibregl.Popup | null>(null);
  const [zoom, setZoom] = React.useState<number>(initialZoom ?? 2);

  // Stable refs to props that the render-markers effect reads, so we
  // don't have to retear all markers when a callback identity changes.
  const onMarkerClickRef = React.useRef(onMarkerClick);
  React.useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  // Init the map once. We intentionally don't depend on `markers` here —
  // marker churn shouldn't tear down the GL context.
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initialBounds = bounds(markers);
    const center: [number, number] = initialCenter ?? [
      (initialBounds[0][0] + initialBounds[1][0]) / 2,
      (initialBounds[0][1] + initialBounds[1][1]) / 2,
    ];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom: initialZoom ?? 2,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("zoom", () => setZoom(map.getZoom()));

    // Fit to markers once style + first paint are ready.
    map.once("load", () => {
      if (!markers.length) return;
      if (initialCenter || initialZoom != null) return;
      try {
        map.fitBounds(initialBounds, { padding: 40, duration: 0, maxZoom: 14 });
      } catch {
        /* ignore — fitBounds throws on identical points; default center wins */
      }
    });

    mapRef.current = map;
    return () => {
      // Tear down all markers before removing the map.
      for (const m of markerRefs.current) {
        m.marker.remove();
        m.root.unmount();
      }
      markerRefs.current = [];
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  // Decide whether to cluster: when current zoom is below the threshold
  // OR many markers, we collapse close ones. Grid-bucket size is a
  // function of zoom so it loosens at world view, tightens when the
  // user zooms in.
  const renderUnits = React.useMemo<RenderUnit[]>(() => {
    const shouldCluster = zoom < clusterAtZoom && markers.length > 1;
    if (!shouldCluster) {
      return markers.map((m) => ({
        kind: "marker" as const,
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        marker: m,
      }));
    }
    // Bucket size: 8° at world view, halved each zoom level, floored at ~0.05°.
    const cellSize = Math.max(0.05, 8 / Math.pow(2, Math.max(0, zoom)));
    const clusters = clusterMarkers(markers, cellSize);
    const byId = new Map(markers.map((m) => [m.id, m]));
    return clusters.map((c) => {
      if (c.count === 1) {
        const m = byId.get(c.ids[0]!)!;
        return { kind: "marker" as const, id: m.id, lat: m.lat, lng: m.lng, marker: m };
      }
      return {
        kind: "cluster" as const,
        id: `cluster:${c.ids.join(",")}`,
        lat: c.lat,
        lng: c.lng,
        count: c.count,
        ids: c.ids,
      };
    });
  }, [markers, zoom, clusterAtZoom]);

  // Mount / unmount maplibre Markers when the render plan changes.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Tear down existing.
    for (const existing of markerRefs.current) {
      existing.marker.remove();
      existing.root.unmount();
    }
    markerRefs.current = [];

    for (const u of renderUnits) {
      const el = document.createElement("div");
      el.style.cssText = "transform: translate(-50%, -50%);";
      const root = createRoot(el);
      if (u.kind === "marker") {
        const tone = u.marker.tone;
        root.render(<MapMarkerChip tone={tone} title={u.marker.title} />);
      } else {
        // Aggregate tone across the cluster: take the first marker's tone.
        // Good enough for legend / glance; popup shows the breakdown.
        root.render(<MapMarkerChip count={u.count} title={`${u.count} locations`} />);
      }
      const marker = new maplibregl.Marker({ element: el }).setLngLat([u.lng, u.lat]).addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (u.kind === "cluster") {
          map.easeTo({
            center: [u.lng, u.lat],
            zoom: Math.min(map.getMaxZoom(), Math.max(map.getZoom() + 2, clusterAtZoom)),
            duration: 350,
          });
          return;
        }
        const cb = onMarkerClickRef.current;
        if (cb) {
          cb(u.marker);
          return;
        }
        if (u.marker.href) {
          window.open(u.marker.href, "_blank", "noopener,noreferrer");
          return;
        }
        // Default: open a popup.
        popupRef.current?.remove();
        const popupNode = document.createElement("div");
        popupNode.style.cssText = "min-width: 180px; max-width: 260px;";
        const popupRoot = createRoot(popupNode);
        popupRoot.render(<MarkerPopup marker={u.marker} />);
        const popup = new maplibregl.Popup({ closeButton: true, offset: 14 })
          .setLngLat([u.lng, u.lat])
          .setDOMContent(popupNode)
          .addTo(map);
        popup.on("close", () => popupRoot.unmount());
        popupRef.current = popup;
      });

      markerRefs.current.push({ marker, root, el });
    }
  }, [renderUnits, clusterAtZoom]);

  // When the marker collection itself changes shape (count / bounds),
  // refit so newly-added pins stay on screen.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (initialCenter || initialZoom != null) return;
    if (!markers.length) return;
    const b = bounds(markers);
    if (b[0][0] === b[1][0] && b[0][1] === b[1][1]) return;
    const fit = () => {
      try {
        map.fitBounds(b, { padding: 40, duration: 250, maxZoom: 14 });
      } catch {
        /* swallow */
      }
    };
    if (map.isStyleLoaded()) fit();
    else map.once("load", fit);
  }, [markers, initialCenter, initialZoom]);

  const toneCounts = React.useMemo(() => {
    const counts: Partial<Record<MapMarkerTone, number>> = {};
    for (const m of markers) {
      const t = (m.tone ?? "info") as MapMarkerTone;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [markers]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        height,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "var(--border-strong, 1px solid var(--p-border))",
        background: "var(--p-surface)",
      }}
    >
      {markers.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <EmptyState
            size="compact"
            title="No locations on map"
            description="Add an address or lat/lng to a record to see it here."
          />
        </div>
      ) : (
        <>
          <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
          {legend && Object.keys(toneCounts).length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: "var(--p-surface)",
                color: "var(--p-text-1)",
                border: "1px solid var(--p-border)",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 11,
                lineHeight: 1.6,
                fontFamily: "var(--font-mono, ui-monospace)",
                boxShadow: "var(--p-elev-1, 0 1px 2px rgba(0,0,0,0.2))",
                pointerEvents: "none",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
              aria-label="Map legend"
            >
              {(Object.keys(toneCounts) as MapMarkerTone[]).map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: markerColor(t),
                      border: "1px solid var(--p-bg)",
                    }}
                  />
                  <span style={{ flex: 1 }}>{TONE_LABELS[t]}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{toneCounts[t]}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

type RenderUnit =
  | { kind: "marker"; id: string; lat: number; lng: number; marker: MapMarker }
  | { kind: "cluster"; id: string; lat: number; lng: number; count: number; ids: string[] };

function MarkerPopup({ marker }: { marker: MapMarker }): React.ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <strong style={{ fontSize: 13, lineHeight: 1.3 }}>{marker.title}</strong>
      {marker.popup ? <div style={{ fontSize: 12, color: "var(--p-text-2)" }}>{marker.popup}</div> : null}
      {marker.href ? (
        <a
          href={marker.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: "var(--p-accent, var(--p-info))",
            textDecoration: "underline",
          }}
        >
          View details
        </a>
      ) : null}
    </div>
  );
}
