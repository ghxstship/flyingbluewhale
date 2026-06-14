import { pictogramSymbolId, type SignageSign } from "@/lib/legend_signage";

/**
 * Renders a sign's pictogram from the shared sprite at
 * `/brand/pictograms.svg` via <use href="…#<symbol-id>">. The glyph uses
 * currentColor, so `color` (driven off the sign colorway) tints it; the
 * tile background + border come from theme tokens only.
 */
export function PictogramPreview({
  sign,
  size = 56,
}: {
  sign: Pick<SignageSign, "pictogram_key" | "category" | "name">;
  size?: number;
}) {
  const id = pictogramSymbolId(sign);
  return (
    <span
      className="surface-inset inline-flex items-center justify-center rounded-md text-[var(--p-text-1)]"
      style={{ width: size, height: size }}
    >
      <svg
        role="img"
        aria-label={sign.name}
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 48 48"
      >
        <use href={`/brand/pictograms.svg#${id}`} />
      </svg>
    </span>
  );
}
