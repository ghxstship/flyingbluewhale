import type { CSSProperties, HTMLAttributes } from "react";

/**
 * Skeleton — shimmer placeholder for loading content (the `.ps-skel` class).
 * Use a `variant` for common shapes or set `width`/`height`/`radius` directly.
 * Respects prefers-reduced-motion (the shimmer stops). Compose the presets —
 * SkeletonText / SkeletonTableRows / SkeletonCard — for whole loading layouts so
 * a slow load reads as "loading", never as "empty".
 *
 * Lifecycle rule (kit): loading → Skeleton · no data → EmptyState · failure →
 * EmptyState error/offline. Never collapse the three.
 */
export type SkeletonVariant = "line" | "text" | "title" | "avatar" | "chip" | "button" | "block";

const PRESETS: Record<SkeletonVariant, { width: number | string; height: number; radius: number | string }> = {
  line: { width: "100%", height: 12, radius: 6 },
  text: { width: "100%", height: 12, radius: 6 },
  title: { width: "60%", height: 20, radius: 7 },
  avatar: { width: 36, height: 36, radius: "50%" },
  chip: { width: 64, height: 22, radius: 999 },
  button: { width: 104, height: 36, radius: 10 },
  block: { width: "100%", height: 120, radius: 12 },
};

export function Skeleton({
  variant = "line",
  width,
  height,
  radius,
  className = "",
  style,
  ...rest
}: {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">) {
  const p = PRESETS[variant] ?? PRESETS.line;
  return (
    <div
      className={`ps-skel ${className}`.trim()}
      aria-hidden="true"
      style={{ width: width ?? p.width, height: height ?? p.height, borderRadius: radius ?? p.radius, ...style }}
      {...rest}
    />
  );
}

/** N lines of text; the last is shortened like a real paragraph. */
export function SkeletonText({ lines = 3, gap = 8, lastWidth = "70%" }: { lines?: number; gap?: number; lastWidth?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="line" width={i === lines - 1 ? lastWidth : "100%"} />
      ))}
    </div>
  );
}

/** Loading rows for a DataTable — render in place of the table body. */
export function SkeletonTableRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Loading" style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 2px" }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, alignItems: "center" }}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} variant="line" width={c === 0 ? "80%" : "60%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** A card-shaped loading placeholder: media block, title, two text lines. */
export function SkeletonCard({ media = true }: { media?: boolean }) {
  return (
    <div role="status" aria-label="Loading" style={{ display: "flex", flexDirection: "column", gap: 12 } as CSSProperties}>
      {media ? <Skeleton variant="block" /> : null}
      <Skeleton variant="title" />
      <SkeletonText lines={2} />
    </div>
  );
}
