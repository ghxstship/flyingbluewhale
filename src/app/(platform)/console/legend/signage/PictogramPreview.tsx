import { SignIcon } from "@/components/signage/SignIcon";
import { pictogramSymbolId, type SignageSign } from "@/lib/legend_signage";

/**
 * The sign-library tile: a sign's pictogram on a tinted inset tile. Renders
 * through `<SignIcon>` (the single sprite render path); the glyph uses
 * currentColor, so the tile's `color` (driven off the sign colorway by the
 * caller) tints it, while the tile background + border come from theme tokens.
 */
export function PictogramPreview({
  sign,
  size = 56,
}: {
  sign: Pick<SignageSign, "pictogram_key" | "category" | "name">;
  size?: number;
}) {
  return (
    <span
      className="surface-inset inline-flex items-center justify-center rounded-md text-[var(--p-text-1)]"
      style={{ width: size, height: size }}
    >
      <SignIcon name={pictogramSymbolId(sign)} size={Math.round(size * 0.72)} title={sign.name} />
    </span>
  );
}
