"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * FloorPlan — a plan canvas (background image, or a striped placeholder) with
 * pins positioned by x/y as 0–100 percent. Clicking a pin selects it; the
 * selected pin is highlighted. Pin tone defaults to the product accent, or the
 * provided token string. Ported from the ATLVS kit
 * (kits/core/components/spatial/FloorPlan.d.ts).
 */
export type FloorPlanPlacement = {
  id: string;
  /** 0–100 percent of the plan width. */
  x: number;
  /** 0–100 percent of the plan height. */
  y: number;
  label: ReactNode;
  /** A CSS color token, e.g. "var(--p-warning)". Defaults to the accent. */
  tone?: string;
};

export function FloorPlan({
  image,
  placements = [],
  onSelect,
  selectedId,
  height = 480,
  className = "",
  style,
}: {
  image?: string;
  placements?: FloorPlanPlacement[];
  onSelect?: (p: FloorPlanPlacement) => void;
  selectedId?: string;
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        border: "1px solid var(--p-border)",
        borderRadius: "var(--p-r-lg, 12px)",
        background: image
          ? "var(--p-surface)"
          : "repeating-linear-gradient(45deg, var(--p-surface) 0, var(--p-surface) 16px, var(--p-surface-2) 16px, var(--p-surface-2) 32px)",
        ...style,
      }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt="Floor plan"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}

      {placements.map((p) => {
        const tone = p.tone ?? "var(--p-accent)";
        const isSelected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            title={typeof p.label === "string" ? p.label : undefined}
            aria-pressed={isSelected}
            onClick={() => onSelect?.(p)}
            style={{
              position: "absolute",
              insetInlineStart: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: isSelected ? "5px 10px" : "4px 8px",
              border: `2px solid ${isSelected ? tone : "var(--p-surface)"}`,
              borderRadius: "999px",
              background: tone,
              color: "var(--p-accent-cta-contrast)",
              cursor: "pointer",
              font: "inherit",
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: isSelected
                ? "0 0 0 4px color-mix(in srgb, var(--p-accent) 30%, transparent), var(--p-elev-md, 0 4px 12px rgba(0,0,0,0.18))"
                : "var(--p-elev-sm, 0 1px 4px rgba(0,0,0,0.14))",
              transition: "box-shadow var(--motion-fast) var(--ease-standard), padding var(--motion-fast) var(--ease-standard)",
              zIndex: isSelected ? 2 : 1,
            }}
          >
            <span
              aria-hidden
              style={{ width: 8, height: 8, borderRadius: "999px", background: "var(--p-accent-cta-contrast)", flexShrink: 0 }}
            />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
