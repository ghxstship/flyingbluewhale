import { describe, it, expect, vi } from "vitest";

// hasResend:false drives the sendEmail no-op path; httpFetch is mocked so
// any accidental network call is observable (and impossible).
vi.mock("@/lib/env", () => ({
  env: { RESEND_API_KEY: undefined, RESEND_FROM: undefined },
  hasResend: false,
}));

vi.mock("@/lib/http", () => ({
  httpFetch: vi.fn(),
}));

import { wrapEmailHtml, sendEmail } from "./email";
import { httpFetch } from "./http";
import { BRAND } from "./brand";
import { SITE } from "./seo";

describe("wrapEmailHtml", () => {
  it("defaults to the atlvs accent — pink tile + atlvs icon", () => {
    const html = wrapEmailHtml("<p>hi</p>");
    expect(html).toContain("#FF2E88");
    expect(html).toContain("/brand/atlvs-icon-atlvs.svg");
  });

  it("swaps the accent tile for compvss and gvteway senders", () => {
    const compvss = wrapEmailHtml("<p>hi</p>", { accent: "compvss" });
    expect(compvss).toContain("#E9A23B");
    expect(compvss).toContain("/brand/atlvs-icon-compvss.svg");
    expect(compvss).not.toContain("#FF2E88");

    const gvteway = wrapEmailHtml("<p>hi</p>", { accent: "gvteway" });
    expect(gvteway).toContain("#2563EB");
    expect(gvteway).toContain("/brand/atlvs-icon-gvteway.svg");
  });

  it("carries the default ATLVS chrome — spaced mark + apex endorsement", () => {
    const html = wrapEmailHtml("<p>hi</p>");
    expect(html).toContain(BRAND.mark); // "A T L V S" header wordmark
    expect(html).toContain(BRAND.apexDomain); // "atlvs.pro" footer endorsement
    expect(html).toContain("Powered by"); // co-brand-within-shell footer
  });

  it("co-brands the header with a producer brand — mark, logo, accent", () => {
    const html = wrapEmailHtml("<p>hi</p>", {
      brand: { producerName: "GHXSTSHIP", producerLogoUrl: "https://cdn.example/skull.png", accent: "#000000" },
    });
    expect(html).toContain("GHXSTSHIP"); // producer wordmark in header
    expect(html).toContain("https://cdn.example/skull.png"); // producer logo
    expect(html).toContain("#000000"); // accent applied to the endorsement link
    expect(html).toContain("Powered by"); // ATLVS endorsement retained
  });

  it("resolves brand assets to absolute URLs rooted at the canonical apex", () => {
    const html = wrapEmailHtml("<p>hi</p>");
    const base = SITE.baseUrl.replace(/\/+$/, "");
    expect(html).toContain(`${base}/brand/atlvs-icon-atlvs.svg`);
    expect(html).not.toContain('src="/brand/');
  });

  it("passes the body through verbatim — no escaping or rewriting", () => {
    const body = `<p data-test="1">Tom &amp; Jerry's <strong>"deal"</strong> — 100% < 200%</p>`;
    const html = wrapEmailHtml(body);
    expect(html).toContain(body);
    // Exactly once — the chrome must not duplicate the body slot.
    expect(html.indexOf(body)).toBe(html.lastIndexOf(body));
  });
});

describe("sendEmail", () => {
  it("no-ops with ok:true when RESEND_API_KEY is absent, never touching the network", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const result = await sendEmail({ to: "crew@gvteway.test", subject: "Test", html: "<p>hi</p>" });
    expect(result).toEqual({ ok: true });
    expect(httpFetch).not.toHaveBeenCalled();
    infoSpy.mockRestore();
  });
});
