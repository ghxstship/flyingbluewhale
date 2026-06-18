import type { CSSProperties } from "react";
import { getPictogram } from "@/lib/signage_pictograms";

/**
 * SignIcon — a single wayfinding pictogram from the shared sprite at
 * `/brand/pictograms.svg`, rendered via `<use href="…#<id>">`. Covers both the
 * house `p-*` glyphs and the public-domain AIGA / U.S. DOT symbol-sign set.
 *
 * Monochrome: the sprite glyphs use `currentColor`, so the icon inherits `color`
 * from any ancestor (or the optional `color` prop). Every symbol is normalized
 * to a 48×48 box, so instances stay square and uniform.
 *
 * The low-level primitive: `PictogramPreview` (the sign-library tile) and
 * `SignPanel` (the full airport sign) both render through this — one render path.
 */
export function SignIcon({
  name,
  size = 48,
  title,
  color,
  className,
  style,
  ...rest
}: {
  /** Sprite symbol id, e.g. `aiga-toilets` or `p-exit`. */
  name: string;
  size?: number;
  title?: string;
  /** Optional explicit tint; defaults to inherited `currentColor`. */
  color?: string;
  className?: string;
  style?: CSSProperties;
} & Omit<React.SVGProps<SVGSVGElement>, "name" | "color" | "style">) {
  const meta = getPictogram(name);
  return (
    <svg
      role="img"
      aria-label={title ?? meta?.label ?? name}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={{ display: "block", ...(color ? { color } : {}), ...style }}
      {...rest}
    >
      <use href={`/brand/pictograms.svg#${name}`} />
    </svg>
  );
}
