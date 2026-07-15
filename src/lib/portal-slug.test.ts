import { describe, expect, it } from "vitest";
import { extractPortalSlug, escapeHtml } from "./portal-slug";
import { portalConsumerNav } from "./nav";

describe("extractPortalSlug", () => {
  it("returns the slug for a real /p/<slug>/<page> path", () => {
    expect(extractPortalSlug("/p/mmw26-hialeah/guide")).toBe("mmw26-hialeah");
    expect(extractPortalSlug("/p/edclv26/client/proposals")).toBe("edclv26");
  });

  it("returns the slug when the slug is the whole path", () => {
    expect(extractPortalSlug("/p/mmw26-hialeah")).toBe("mmw26-hialeah");
    expect(extractPortalSlug("/p/foo/")).toBe("foo");
  });

  it("returns null for non-/p paths", () => {
    expect(extractPortalSlug("/studio/projects")).toBeNull();
    expect(extractPortalSlug("/m/check-in")).toBeNull();
    expect(extractPortalSlug("/login")).toBeNull();
    expect(extractPortalSlug("/")).toBeNull();
  });

  it("returns null for the reserved sentinel slugs", () => {
    expect(extractPortalSlug("/p/select")).toBeNull();
    expect(extractPortalSlug("/p/select/foo")).toBeNull();
    expect(extractPortalSlug("/p/undefined")).toBeNull();
    expect(extractPortalSlug("/p/null/anything")).toBeNull();
  });

  it("preserves slug casing + numerics + hyphens", () => {
    expect(extractPortalSlug("/p/MyOrg-2026/guide")).toBe("MyOrg-2026");
  });

  it("returns null when there's no slug segment", () => {
    expect(extractPortalSlug("/p/")).toBeNull();
    expect(extractPortalSlug("/p")).toBeNull();
  });

  // The reserved-segment set in portal-slug.ts is a hand-maintained mirror of
  // the GVTEWAY consumer routes. Miss an entry and the proxy's slug pre-check
  // DB-resolves the route name as a tenant slug, finds nothing, and serves a
  // hard 404 — the real route never gets a chance to render. That failure is
  // invisible to `gen:sitemap` (the file exists and is nav-reached), so it
  // needs its own guard. Caught /p/onsite in exactly this state on 2026-07-15.
  it("reserves every top-level portalConsumerNav route", () => {
    const consumerSegments = portalConsumerNav
      .flatMap((g) => g.items)
      .map((i) => i.href)
      .filter((href) => /^\/p\/[^/]+$/.test(href));

    // Guard the guard: if the nav shape changes and this filter stops
    // matching, the loop below would vacuously pass.
    expect(consumerSegments.length).toBeGreaterThan(5);

    for (const href of consumerSegments) {
      expect(extractPortalSlug(href), `${href} must be a reserved segment`).toBeNull();
      expect(extractPortalSlug(`${href}/nested`), `${href}/nested must be reserved`).toBeNull();
    }
  });
});

describe("escapeHtml", () => {
  it("entity-encodes the five HTML metacharacters", () => {
    const out = escapeHtml(`<script>alert("xss")</script>&'`);
    // Literal `<`, `>`, `"`, `'` must not survive — they break out of
    // HTML attribute / tag context. `&` IS present in the output but
    // only as the leading char of the numeric entities themselves.
    expect(out).not.toMatch(/[<>"']/);
    // Bare `&` (one not followed by `#NN;`) would be a leak.
    expect(out).not.toMatch(/&(?!#\d+;)/);
    // Spot-check the entity for `<` so we know we're entity-encoding
    // and not just stripping.
    expect(out).toContain("&#60;");
  });

  it("leaves alphanumerics + safe punctuation untouched", () => {
    expect(escapeHtml("mmw26-hialeah")).toBe("mmw26-hialeah");
    expect(escapeHtml("foo_bar.baz")).toBe("foo_bar.baz");
  });

  it("handles empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes every occurrence in a long string", () => {
    const out = escapeHtml(`${"<".repeat(5)}`);
    expect(out).toBe("&#60;&#60;&#60;&#60;&#60;");
  });
});
