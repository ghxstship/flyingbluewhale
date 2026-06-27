import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * MediaCard — a thumbnail-led card for media/identity surfaces (tracks,
 * releases, talent EPKs, courses, signage). Thumbnail rides an aspect-ratio
 * token, with optional overlay badge and trailing action. Becomes
 * keyboard-accessible when `href` or `onClick` is provided.
 *
 * Colors come only from `--p-*` tokens via `.surface`/Tailwind arbitrary
 * values; the thumbnail box uses the `--p-ar-*` aspect-ratio tokens.
 */
export type MediaCardAspect = "video" | "square" | "photo";

const ASPECT: Record<MediaCardAspect, string> = {
  video: "aspect-[var(--p-ar-video)]",
  square: "aspect-[var(--p-ar-square)]",
  photo: "aspect-[var(--p-ar-photo)]",
};

export type MediaCardProps = {
  /** Thumbnail image src. When absent a token-tinted placeholder is shown. */
  thumbnailSrc?: string | null;
  /** Required alt text for the thumbnail (empty string allowed for decorative). */
  thumbnailAlt?: string;
  title: string;
  /** Secondary line beneath the title (artist, role, meta). */
  subtitle?: string;
  /** Aspect ratio of the thumbnail box. Defaults to "video" (16/9). */
  aspect?: MediaCardAspect;
  /** Overlay badge rendered top-start over the thumbnail (e.g. duration, "LIVE"). */
  overlayBadge?: ReactNode;
  /** Trailing action node (button/menu) in the meta row. Stops click propagation. */
  action?: ReactNode;
  /** Placeholder content (icon/initial) when no thumbnail src is supplied. */
  placeholder?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

function Thumbnail({
  thumbnailSrc,
  thumbnailAlt,
  aspect,
  overlayBadge,
  placeholder,
}: Pick<MediaCardProps, "thumbnailSrc" | "thumbnailAlt" | "overlayBadge" | "placeholder"> & {
  aspect: MediaCardAspect;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-[var(--p-surface-2)] ${ASPECT[aspect]}`}>
      {thumbnailSrc ? (
        <Image
          src={thumbnailSrc}
          alt={thumbnailAlt ?? ""}
          fill
          sizes="(max-width: 768px) 50vw, 320px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--p-text-3)]" aria-hidden="true">
          {placeholder ?? <span className="font-[family-name:var(--p-mono)] text-xs tracking-wide uppercase">No media</span>}
        </div>
      )}
      {overlayBadge && <div className="absolute start-2 top-2 z-10">{overlayBadge}</div>}
    </div>
  );
}

function Meta({ title, subtitle, action }: Pick<MediaCardProps, "title" | "subtitle" | "action">) {
  return (
    <div className="flex items-start justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--p-text-1)]">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-[var(--p-text-2)]">{subtitle}</p>}
      </div>
      {action && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- wrapper only stops the card's click/keydown from firing on action interaction; the action child carries its own semantics.
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      )}
    </div>
  );
}

export function MediaCard({
  thumbnailSrc,
  thumbnailAlt,
  title,
  subtitle,
  aspect = "video",
  overlayBadge,
  action,
  placeholder,
  href,
  onClick,
  className = "",
  ...props
}: MediaCardProps) {
  const isInteractive = !!href || !!onClick;
  const base = "surface overflow-hidden rounded-[var(--p-r,8px)]";
  const interactive = isInteractive ? "hover-lift cursor-pointer focus-ring outline-none text-start" : "";
  const cls = `${base} ${interactive} ${className}`.trim();
  const inner = (
    <>
      <Thumbnail
        thumbnailSrc={thumbnailSrc}
        thumbnailAlt={thumbnailAlt}
        aspect={aspect}
        overlayBadge={overlayBadge}
        placeholder={placeholder}
      />
      <Meta title={title} subtitle={subtitle} action={action} />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={props["aria-label"] ?? title}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} w-full`} aria-label={props["aria-label"] ?? title}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
