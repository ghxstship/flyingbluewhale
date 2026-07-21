import { describe, expect, it } from "vitest";
import { FIELD_CAPABILITIES, grantedSiteCapabilities } from "./site-capabilities";

describe("grantedSiteCapabilities", () => {
  it("returns only the granted subset (cleared-only, never denied)", () => {
    // A field crew member: base field caps but no manager authorities.
    const crewGrants = new Set(["time:write", "tasks:write", "tasks:read", "check-in:write", "projects:read"]);
    const granted = grantedSiteCapabilities((c) => crewGrants.has(c));
    const caps = granted.map((g) => g.cap);
    expect(caps).toContain("time:write");
    expect(caps).toContain("check-in:write");
    expect(caps).toContain("tasks:write");
    // Manager-band authorities are NOT granted → not surfaced.
    expect(caps).not.toContain("schedule:write");
    expect(caps).not.toContain("people:manage");
    expect(caps).not.toContain("advance:approve");
  });

  it("owner/admin wildcard clears every field capability", () => {
    // can(session,'*') is true for all → the predicate matches everything.
    const granted = grantedSiteCapabilities(() => true);
    expect(granted).toHaveLength(FIELD_CAPABILITIES.length);
  });

  it("no grants → empty (a community/read-only holder shows nothing)", () => {
    expect(grantedSiteCapabilities(() => false)).toHaveLength(0);
  });

  it("every field capability carries a stable i18n key and icon", () => {
    for (const c of FIELD_CAPABILITIES) {
      expect(c.key).toMatch(/^m\.wallet\.cap\./);
      expect(c.icon.length).toBeGreaterThan(0);
      expect(c.cap).toContain(":");
    }
  });
});
