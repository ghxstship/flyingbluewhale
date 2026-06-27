"use client";

/**
 * <GalleryView> — thumbnail-card renderer for collection pages whose rows
 * carry a media or preview field (Phase 3.x of the SmartSuite view-matrix
 * parity; the "gallery"/"card" `DataViewKind`). SmartSuite Card / Gallery
 * View parity: a responsive grid of preview cards instead of a dense
 * table, ideal for catalogs, talent EPKs, equipment, and anything visual.
 *
 *     <GalleryView
 *       items={catalogItems}
 *       columns={4}
 *     />
 *
 * Token/.ps-* styled only — no hex, no hardcoded fonts. "use client"
 * because cards are interactive (hover-lift, keyboard focus) and the
 * caller may pass click handlers.
 */

import * as React from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n/LocaleProvider";

export type GalleryItem = {
  id: string;
  /** Card title. */
  title: string;
  /** Optional secondary line under the title. */
  subtitle?: string | null;
  /** Optional thumbnail/preview image URL. Falls back to a placeholder. */
  imageUrl?: string | null;
  /** Optional state/phase value rendered as a <StatusBadge>. NEVER a bare
   *  status column — pass your *_state / *_phase value here. */
  state?: string | null;
  /** Optional eyebrow / kind chip text above the title. */
  eyebrow?: string | null;
  /** Optional detail href — makes the whole card a link. */
  href?: string;
  /** Optional click handler (overrides href). */
  onClick?: (item: GalleryItem) => void;
  /** Optional footer metadata (price, qty, etc.). */
  meta?: React.ReactNode;
  /** Optional caller data for callbacks. */
  data?: Record<string, unknown>;
};

export type GalleryViewProps = {
  items: GalleryItem[];
  /** Target column count at the widest breakpoint. Default 4. */
  columns?: 2 | 3 | 4 | 5;
  /** Empty-state copy. */
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

const COLS: Record<NonNullable<GalleryViewProps["columns"]>, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
};

export function GalleryView({
  items,
  columns = 4,
  emptyTitle,
  emptyDescription,
  className,
}: GalleryViewProps): React.ReactElement {
  const t = useT();

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? t("components.galleryView.emptyTitle", undefined, "Nothing to Show")}
        description={
          emptyDescription ??
          t(
            "components.galleryView.emptyDescription",
            undefined,
            "Records with a preview image appear here as cards.",
          )
        }
      />
    );
  }

  return (
    <div
      role="list"
      aria-label={t("components.galleryView.label", undefined, "Gallery")}
      className={["grid grid-cols-1 gap-4", COLS[columns], className ?? ""].join(" ")}
    >
      {items.map((item) => (
        <GalleryCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function GalleryCard({ item }: { item: GalleryItem }): React.ReactElement {
  const t = useT();
  const inner = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-[var(--p-surface-2)]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--p-text-2)]">
            <ImageOff size={28} aria-hidden="true" />
          </div>
        )}
        {item.state ? (
          <div className="absolute top-2 end-2">
            <StatusBadge status={item.state} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-3">
        {item.eyebrow ? (
          <span className="eyebrow">{item.eyebrow}</span>
        ) : null}
        <span className="truncate text-sm font-semibold text-[var(--p-text-1)]">{item.title}</span>
        {item.subtitle ? (
          <span className="truncate text-xs text-[var(--p-text-2)]">{item.subtitle}</span>
        ) : null}
        {item.meta ? <div className="mt-1 text-xs text-[var(--p-text-2)]">{item.meta}</div> : null}
      </div>
    </>
  );

  const cardClass =
    "surface hover-lift group flex flex-col overflow-hidden text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]";

  if (item.onClick) {
    return (
      <button
        type="button"
        role="listitem"
        onClick={() => item.onClick?.(item)}
        className={cardClass}
        aria-label={item.title}
      >
        {inner}
      </button>
    );
  }
  if (item.href) {
    return (
      <Link href={item.href} role="listitem" className={cardClass} aria-label={item.title}>
        {inner}
      </Link>
    );
  }
  return (
    <div role="listitem" className={cardClass.replace("hover-lift ", "")} aria-label={item.title}>
      {inner}
      <span className="sr-only">{t("components.galleryView.staticCard", undefined, "Static card")}</span>
    </div>
  );
}
