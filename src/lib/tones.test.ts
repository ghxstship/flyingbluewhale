import { describe, expect, it } from "vitest";
import { FULFILLMENT_STATES } from "@/lib/db/assignments";
import {
  DOCUMENT_STATE_TONE,
  FULFILLMENT_TONE,
  MARKETPLACE_STATUS_TONE,
  PRIORITY_TONE,
  SEVERITY_TONE,
  toneFor,
} from "@/lib/tones";

// Mirrors BadgeVariant in src/components/ui/Badge.tsx (state-coloring subset).
const BADGE_VARIANTS = ["default", "success", "warning", "error", "info", "brand", "brand-soft", "muted"] as const;

describe("tones canon", () => {
  it("colors every fulfillment_state value with a non-default tone", () => {
    for (const state of FULFILLMENT_STATES) {
      expect(toneFor(state), `fulfillment_state "${state}"`).not.toBe("default");
    }
  });

  it("FULFILLMENT_TONE covers the fulfillment_state enum exhaustively", () => {
    expect(Object.keys(FULFILLMENT_TONE).sort()).toEqual([...FULFILLMENT_STATES].sort());
  });

  it("every canonical map value is a valid Badge variant", () => {
    const maps = { FULFILLMENT_TONE, DOCUMENT_STATE_TONE, SEVERITY_TONE, PRIORITY_TONE, MARKETPLACE_STATUS_TONE };
    for (const [name, map] of Object.entries(maps)) {
      for (const [key, tone] of Object.entries(map)) {
        expect(BADGE_VARIANTS, `${name}.${key}`).toContain(tone);
      }
    }
  });

  it("encodes the audit canon decisions for the divergent keys", () => {
    expect(toneFor("draft")).toBe("muted");
    expect(toneFor("pending")).toBe("muted");
    expect(toneFor("approved")).toBe("success");
    expect(toneFor("active")).toBe("success");
  });

  it("falls back to default for unknown or missing states", () => {
    expect(toneFor("definitely_not_a_state")).toBe("default");
    expect(toneFor(null)).toBe("default");
    expect(toneFor(undefined)).toBe("default");
  });
});
