import type { CSSProperties } from "react";
import { SignIcon } from "@/components/signage/SignIcon";
import {
  CATEGORY_TONE,
  pictogramSymbolId,
  signFieldVar,
  signLegendVar,
  type SignageSign,
} from "@/lib/legend_signage";

/**
 * The sign-library tile — a sign's pictogram rendered in its airport
 * color-function tokens: the category's `--sign-{tone}-field` as the field
 * background, the matching `--sign-{tone}-legend` as the pictogram color (e.g.
 * white-on-red for prohibition, black-on-yellow for directional). Renders
 * through `<SignIcon>` (the single sprite render path), which inherits the
 * legend color via currentColor.
 */
export function PictogramPreview({
  sign,
  size = 56,
}: {
  sign: Pick<SignageSign, "pictogram_key" | "category" | "name">;
  size?: number;
}) {
  const tone = CATEGORY_TONE[sign.category];
  return (
    <span
      className="inline-flex items-center justify-center rounded-md"
      style={
        {
          width: size,
          height: size,
          background: signFieldVar(tone),
          color: signLegendVar(tone),
          // Two-color rule: the glyph's counters paint the field, not white.
          "--sign-knock": signFieldVar(tone),
        } as CSSProperties
      }
    >
      <SignIcon name={pictogramSymbolId(sign)} size={Math.round(size * 0.72)} title={sign.name} />
    </span>
  );
}
