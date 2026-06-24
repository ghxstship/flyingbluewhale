import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import { CATALOG_KINDS, FULFILLMENT_STATES } from "@/lib/db/assignments";
import { SURVEY_QUESTION_KINDS } from "@/lib/workforce";

// DB-6 — the DB enums are the ultimate SSOT. Each canonical TS tuple must
// be SET-EQUAL to its `Constants.public.Enums.*` counterpart. Sorted
// compare so a deliberate UI/transition ordering in the TS tuple (e.g.
// FULFILLMENT_STATES) doesn't false-fail — only membership is asserted.
function sorted(xs: readonly string[]): string[] {
  return [...xs].sort();
}

describe("enum sync — canonical TS tuples ↔ DB enums", () => {
  it("CATALOG_KINDS ↔ public.catalog_kind", () => {
    expect(sorted(CATALOG_KINDS)).toEqual(sorted(Constants.public.Enums.catalog_kind));
  });

  it("FULFILLMENT_STATES ↔ public.fulfillment_state", () => {
    expect(sorted(FULFILLMENT_STATES)).toEqual(sorted(Constants.public.Enums.fulfillment_state));
  });

  // survey_questions.question_kind is a plain text column (no DB enum), so
  // the only authoring site is SURVEY_QUESTION_KINDS — assert it stays the
  // exact set the surveys action validates against.
  it("SURVEY_QUESTION_KINDS is the expected membership", () => {
    expect(sorted(SURVEY_QUESTION_KINDS)).toEqual(
      sorted(["single_choice", "multi_choice", "scale", "text", "boolean"]),
    );
  });
});
