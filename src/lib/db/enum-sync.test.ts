import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";
import { CATALOG_KINDS, FULFILLMENT_STATES } from "@/lib/db/assignments";
import {
  ADVANCE_PACKET_STATES,
  ADVANCE_SECTION_KEYS,
  ADVANCE_REQUIREMENTS,
  ADVANCE_ASSIGNED_VIA,
  ADVANCE_BATCH_STATES,
  ADVANCE_DELIVERY_STATES,
  ADVANCE_SUBMISSION_STATES,
  ADVANCE_DEADLINE_KINDS,
} from "@/lib/db/advance-packets";
import { SCHEDULER_BOOKING_STATES, SCHEDULER_LOCATION_KINDS } from "@/lib/db/scheduler";
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

  it("advance merge engine tuples ↔ DB enums (kit 27)", () => {
    expect(sorted(ADVANCE_PACKET_STATES)).toEqual(sorted(Constants.public.Enums.advance_packet_state));
    expect(sorted(ADVANCE_SECTION_KEYS)).toEqual(sorted(Constants.public.Enums.advance_section_key));
    expect(sorted(ADVANCE_REQUIREMENTS)).toEqual(sorted(Constants.public.Enums.advance_requirement));
    expect(sorted(ADVANCE_ASSIGNED_VIA)).toEqual(sorted(Constants.public.Enums.advance_assigned_via));
    expect(sorted(ADVANCE_BATCH_STATES)).toEqual(sorted(Constants.public.Enums.advance_batch_state));
    expect(sorted(ADVANCE_DELIVERY_STATES)).toEqual(sorted(Constants.public.Enums.advance_delivery_state));
    expect(sorted(ADVANCE_SUBMISSION_STATES)).toEqual(sorted(Constants.public.Enums.advance_submission_state));
    expect(sorted(ADVANCE_DEADLINE_KINDS)).toEqual(sorted(Constants.public.Enums.advance_deadline_kind));
  });

  it("scheduler tuples ↔ DB enums (kit 27)", () => {
    expect(sorted(SCHEDULER_BOOKING_STATES)).toEqual(sorted(Constants.public.Enums.scheduler_booking_state));
    expect(sorted(SCHEDULER_LOCATION_KINDS)).toEqual(sorted(Constants.public.Enums.scheduler_location_kind));
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
