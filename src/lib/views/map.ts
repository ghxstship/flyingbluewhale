/**
 * Pure helpers for `<MapView>` (Phase 3.6b of the SmartSuite parity
 * roadmap). Kept dependency-free so unit tests don't need a DOM /
 * `maplibre-gl`.
 *
 * - `bounds(markers)` returns a `[[minLng, minLat], [maxLng, maxLat]]`
 *   bounding box that callers can hand to `map.fitBounds`.
 * - `clusterMarkers(markers, threshold)` does a simple grid-bucket
 *   cluster — fast, deterministic, good enough for hundreds of markers.
 * - `markerColor(tone)` maps a tone keyword to a CSS variable reference
 *   so the marker chip adopts whatever brand / theme overlay is active.
 */

export type LatLng = { lat: number; lng: number };

export type MarkerInput<T> = T & { id: string; lat: number; lng: number };

export type Cluster = {
  /** Centroid latitude. */
  lat: number;
  /** Centroid longitude. */
  lng: number;
  /** Number of markers in the cluster. */
  count: number;
  /** Marker ids contained in the cluster. */
  ids: string[];
};

/** Default world bounds when no markers are supplied. */
const DEFAULT_BOUNDS: [[number, number], [number, number]] = [
  [-180, -85],
  [180, 85],
];

/**
 * Return the [[minLng, minLat], [maxLng, maxLat]] bounding box of the
 * supplied markers. Empty list returns a sensible world-view default
 * so consumers can still call `map.fitBounds` without a guard.
 */
export function bounds(markers: ReadonlyArray<{ lat: number; lng: number }>): [[number, number], [number, number]] {
  if (!markers.length) return DEFAULT_BOUNDS;
  let minLat = Infinity;
  let minLng = Infinity;
  let maxLat = -Infinity;
  let maxLng = -Infinity;
  for (const m of markers) {
    if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) continue;
    if (m.lat < minLat) minLat = m.lat;
    if (m.lat > maxLat) maxLat = m.lat;
    if (m.lng < minLng) minLng = m.lng;
    if (m.lng > maxLng) maxLng = m.lng;
  }
  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) {
    return DEFAULT_BOUNDS;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Cluster markers using a fixed-size grid bucket. `threshold` is the
 * grid cell size in degrees — anything in the same cell collapses
 * into one cluster. ~0.5° is a reasonable default for a continent-
 * scale view.
 *
 * Single-marker buckets are still returned as 1-count "clusters" so
 * the caller can render every bucket the same way.
 */
export function clusterMarkers<T extends { id: string; lat: number; lng: number }>(
  markers: ReadonlyArray<T>,
  threshold: number,
): Cluster[] {
  if (!markers.length) return [];
  const cellSize = threshold > 0 ? threshold : 0.5;
  const buckets = new Map<string, { latSum: number; lngSum: number; ids: string[] }>();
  for (const m of markers) {
    if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) continue;
    const gx = Math.floor(m.lng / cellSize);
    const gy = Math.floor(m.lat / cellSize);
    const key = `${gx}:${gy}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.latSum += m.lat;
      bucket.lngSum += m.lng;
      bucket.ids.push(m.id);
    } else {
      buckets.set(key, { latSum: m.lat, lngSum: m.lng, ids: [m.id] });
    }
  }
  const out: Cluster[] = [];
  for (const b of buckets.values()) {
    const count = b.ids.length;
    out.push({
      lat: b.latSum / count,
      lng: b.lngSum / count,
      count,
      ids: b.ids,
    });
  }
  return out;
}

/**
 * Tone keyword → CSS variable reference. Returning a `var(--token)`
 * means the marker honours light/dark + brand overlays without the
 * primitive carrying any palette knowledge.
 */
export function markerColor(tone: string | undefined): string {
  switch (tone) {
    case "info":
      return "var(--p-info)";
    case "warn":
    case "warning":
      return "var(--p-warning)";
    case "error":
    case "danger":
      return "var(--p-danger)";
    case "success":
      return "var(--p-success)";
    case "accent":
      return "var(--p-accent)";
    case "neutral":
      return "var(--p-text-2)";
    default:
      return "var(--p-accent, var(--p-info))";
  }
}
