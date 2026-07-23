/**
 * Brand resolution canon (L-P3 Brand Studio): the layered precedence is
 * org < project (event kit) < proposal override, client stays an identity
 * layer, and the doc token layer carries ONLY explicitly-authored values so
 * white-label modes win exactly where a brand is set and nowhere else.
 */
import { describe, it, expect } from "vitest";
import {
  BRAND_FALLBACK,
  DOC_BRAND_MODES,
  brandContextToCssVars,
  resolveBrand,
  resolveBrandContext,
  safeBranding,
} from "./branding";

const ORG = { name: "Black Pearl Co.", branding: { accentColor: "#111111", secondaryColor: "#222222" } };
const PROJECT = { branding: { accentColor: "#333333" } };
const OVERRIDE = { accentColor: "#444444", accentForeground: "#000000" };

describe("safeBranding", () => {
  it("strips malformed colors, urls, and font names", () => {
    const b = safeBranding({
      accentColor: "red",
      accentForeground: "#12345",
      logoUrl: "javascript:alert(1)",
      headingFont: "Bebas'; } body { display:none",
      bodyFont: "Hanken Grotesk",
    });
    expect(b.accentColor).toBeUndefined();
    expect(b.accentForeground).toBeUndefined();
    expect(b.logoUrl).toBeUndefined();
    expect(b.headingFont).toBeUndefined();
    expect(b.bodyFont).toBe("Hanken Grotesk");
  });

  it("returns {} on non-object input", () => {
    expect(safeBranding(null)).toEqual({});
    expect(safeBranding("x")).toEqual({});
  });
});

describe("resolveBrandContext precedence (org < project < override)", () => {
  it("falls back to BRAND_FALLBACK when nothing is authored", () => {
    const ctx = resolveBrandContext({ org: { name: "Bare" } });
    expect(ctx.joint.accent).toBe(BRAND_FALLBACK.accent);
    expect(ctx.joint.accentFg).toBe(BRAND_FALLBACK.accentFg);
    expect(ctx.joint.secondary).toBe(BRAND_FALLBACK.secondary);
  });

  it("org branding beats the fallback", () => {
    const ctx = resolveBrandContext({ org: ORG });
    expect(ctx.joint.accent).toBe("#111111");
    expect(ctx.joint.secondary).toBe("#222222");
  });

  it("project (event kit) beats org", () => {
    const ctx = resolveBrandContext({ org: ORG, project: PROJECT });
    expect(ctx.joint.accent).toBe("#333333");
    // Unset project fields fall through to the org layer, not the fallback.
    expect(ctx.joint.secondary).toBe("#222222");
  });

  it("proposal override beats project and org", () => {
    const ctx = resolveBrandContext({ org: ORG, project: PROJECT, proposalOverride: OVERRIDE });
    expect(ctx.joint.accent).toBe("#444444");
    expect(ctx.joint.accentFg).toBe("#000000");
    expect(ctx.joint.secondary).toBe("#222222");
  });

  it("client branding is an identity layer and never repaints the joint accent", () => {
    const ctx = resolveBrandContext({
      org: ORG,
      client: { name: "Acme", branding: { accentColor: "#ff0000" } },
    });
    expect(ctx.joint.accent).toBe("#111111");
    expect(ctx.client?.accent).toBe("#ff0000");
    expect(ctx.client?.name).toBe("Acme");
  });
});

describe("resolveBrand (the one entry point)", () => {
  it("context mirrors resolveBrandContext and cssVars mirror the joint layer", () => {
    const r = resolveBrand({ org: ORG, project: PROJECT });
    expect(r.context).toEqual(resolveBrandContext({ org: ORG, project: PROJECT }));
    expect(r.cssVars).toEqual(brandContextToCssVars(r.context));
    expect(r.cssVars["--p-accent"]).toBe("#333333");
  });

  it("defaults docMode to atlvs and passes an explicit mode through", () => {
    expect(resolveBrand({ org: ORG }).docMode).toBe("atlvs");
    for (const mode of DOC_BRAND_MODES) {
      expect(resolveBrand({ org: ORG, docMode: mode }).docMode).toBe(mode);
    }
  });

  it("doc tokens carry ONLY explicit values: unbranded org gets no fallback hex", () => {
    const r = resolveBrand({ org: { name: "Bare" } });
    expect(r.doc.org.accent).toBeUndefined();
    expect(r.doc.org.accentText).toBeUndefined();
    expect(r.doc.org.logo).toBeUndefined();
    expect(r.doc.org.name).toBe("Bare");
    // The fallback-applied context still resolves concrete hex for PDFs.
    expect(r.context.joint.accent).toBe(BRAND_FALLBACK.accent);
  });

  it("doc tokens follow the same cascade: override > project > org", () => {
    expect(resolveBrand({ org: ORG }).doc.org.accent).toBe("#111111");
    expect(resolveBrand({ org: ORG, project: PROJECT }).doc.org.accent).toBe("#333333");
    expect(resolveBrand({ org: ORG, project: PROJECT, proposalOverride: OVERRIDE }).doc.org.accent).toBe("#444444");
  });

  it("resolves the sanitized jsonb keys (accentColor/accentForeground), never the legacy accent/accentText", () => {
    const r = resolveBrand({ org: { name: "X", branding: { accent: "#ff0000", accentText: "#00ff00" } } });
    expect(r.doc.org.accent).toBeUndefined();
    expect(r.doc.org.accentText).toBeUndefined();
  });

  it("maps client identity into the doc token layer", () => {
    const r = resolveBrand({
      org: ORG,
      client: { name: "Acme", logo_url: "https://cdn.example/acme.png" },
    });
    expect(r.doc.client?.name).toBe("Acme");
    expect(r.doc.client?.logo).toBe("https://cdn.example/acme.png");
  });
});
