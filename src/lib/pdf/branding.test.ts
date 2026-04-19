/**
 * Dual-brand resolver guards. The PDF pipeline must never crash because
 * a tenant's branding jsonb is partial or absent.
 */
import { describe, it, expect } from "vitest";
import { resolvePdfBrand, DEFAULT_ACCENT } from "./branding";

describe("resolvePdfBrand", () => {
  it("returns safe defaults when org has no branding at all", () => {
    const b = resolvePdfBrand({ org: { name: null, branding: null } });
    expect(b.producerName).toBe("Producer");
    expect(b.producerLogoUrl).toBe(null);
    expect(b.producerAccent).toBe(DEFAULT_ACCENT);
    expect(b.clientName).toBe(null);
  });

  it("prefers name_override over name when both present", () => {
    const b = resolvePdfBrand({
      org: { name: "Legal Name LLC", name_override: "Brand Name", branding: null },
    });
    expect(b.producerName).toBe("Brand Name");
  });

  it("rejects non-HTTPS logo URLs", () => {
    const b = resolvePdfBrand({
      org: { name: "X", branding: { logoUrl: "javascript:alert(1)" } },
    });
    expect(b.producerLogoUrl).toBe(null);
  });

  it("accepts a valid HTTPS logo from branding jsonb", () => {
    const b = resolvePdfBrand({
      org: { name: "X", branding: { logoUrl: "https://cdn.example/logo.png" } },
    });
    expect(b.producerLogoUrl).toBe("https://cdn.example/logo.png");
  });

  it("honors the accentColor in branding jsonb", () => {
    const b = resolvePdfBrand({
      org: { name: "X", branding: { accentColor: "#ff6600" } },
    });
    expect(b.producerAccent).toBe("#ff6600");
  });

  it("includes dual-brand client info when a client is passed", () => {
    const b = resolvePdfBrand({
      org: { name: "Prod", branding: { accentColor: "#111111" } },
      client: { name: "Acme Events", branding: { accentColor: "#ff0000" } },
    });
    expect(b.clientName).toBe("Acme Events");
    expect(b.clientAccent).toBe("#ff0000");
    expect(b.legalFooter).toMatch(/Prepared for Acme Events/);
  });

  it("produces a stable legal footer with the current year", () => {
    const b = resolvePdfBrand({ org: { name: "Prod", branding: null } });
    expect(b.legalFooter).toMatch(new RegExp(`© ${new Date().getUTCFullYear()} Prod`));
  });
});
