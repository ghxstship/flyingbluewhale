"use client";

/**
 * Catalog-specific adapter for the generic <GalleryView>. Maps master
 * catalog rows into gallery cards and formats the price + inventory
 * footer. Keeps the currency formatting on the client so the server page
 * stays a thin data loader.
 */

import * as React from "react";
import { GalleryView, type GalleryItem } from "@/components/views";

export type CatalogGalleryItem = {
  id: string;
  title: string;
  eyebrow: string;
  subtitle: string | null;
  state: string;
  href: string;
  unitCostCents: number | null;
  currency: string | null;
  inventoryQty: number | null;
};

export function CatalogGallery({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: CatalogGalleryItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}): React.ReactElement {
  const galleryItems: GalleryItem[] = items.map((it) => ({
    id: it.id,
    title: it.title,
    eyebrow: it.eyebrow,
    subtitle: it.subtitle,
    state: it.state,
    href: it.href,
    meta: (
      <div className="flex items-center justify-between gap-2 font-mono">
        <span>
          {it.unitCostCents != null
            ? (it.unitCostCents / 100).toLocaleString("en-US", {
                style: "currency",
                currency: it.currency ?? "USD",
              })
            : "—"}
        </span>
        <span>{it.inventoryQty != null ? `${it.inventoryQty} on hand` : "—"}</span>
      </div>
    ),
  }));

  return <GalleryView items={galleryItems} columns={4} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />;
}
