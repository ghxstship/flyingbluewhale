"use client";

import * as React from "react";
import { FloorPlan, type FloorPlanPlacement } from "@/components/ui/FloorPlan";

export type SitePlanMapProps = {
  image?: string;
  placements: FloorPlanPlacement[];
  emptyLabel: string;
  detailLabel: string;
};

/**
 * Client wrapper that mounts the kit <FloorPlan> with pin-selection state and a
 * detail readout (kit v7 spatial archetype). Pins are positioned by x/y percent
 * derived server-side from each placement's footprint.
 */
export function SitePlanMap({ image, placements, emptyLabel, detailLabel }: SitePlanMapProps): React.ReactElement {
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const selected = placements.find((p) => p.id === selectedId);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,260px)]">
      <FloorPlan
        image={image}
        placements={placements}
        selectedId={selectedId}
        onSelect={(p) => setSelectedId(p.id)}
        height={520}
      />
      <aside className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-4">
        <h2 className="mb-2 font-mono text-xs tracking-[0.08em] text-[var(--p-text-3)] uppercase">{detailLabel}</h2>
        {selected ? (
          <p className="text-sm font-medium text-[var(--p-text-1)]">{selected.label}</p>
        ) : (
          <p className="text-sm text-[var(--p-text-3)]">{emptyLabel}</p>
        )}
      </aside>
    </div>
  );
}
