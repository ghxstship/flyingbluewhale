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

import { wrapEmailHtml, sendEmail, htmlToText } from "./email";
import { httpFetch } from "./http";
import { BRAND } from "./brand";
import { SITE } from "./seo";

describe("wrapEmailHtml", () => {
  it("defaults to the atlvs accent — atlvs volcanic-red tile + atlvs icon", () => {
    const html = wrapEmailHtml("<p>hi</p>");
    expect(html).toContain("#E23414");
    expect(html).toContain("/brand/atlvs-icon-atlvs.svg");
  });

  it("swaps the accent tile per sender (v8 palette-locked — each product its own hue)", () => {
    // v8.0 palette-locked: each product owns its accent — COMPVSS signal yellow,
    // GVTEWAY blue — distinct from the default ATLVS volcanic red.
    const compvss = wrapEmailHtml("<p>hi</p>", { accent: "compvss" });
    expect(compvss).toContain("#FFC400");
    expect(compvss).toContain("/brand/atlvs-icon-compvss.svg");

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
  it("skips with ok:true + skipped:true when RESEND_API_KEY is absent, never touching the network (E-21)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await sendEmail({ to: "crew@gvteway.test", subject: "Test", html: "<p>hi</p>" });
    // The honest contract: nothing was delivered and the caller can tell.
    expect(result).toEqual({ ok: true, skipped: true });
    expect(httpFetch).not.toHaveBeenCalled();
    // The skip is loud on the server so operators can tell email is off.
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("htmlToText (E-11 plain-text alternative)", () => {
  it("strips tags, preserves line structure, and keeps CTA URLs", () => {
    const text = htmlToText(
      `<h1>Big News</h1><p>Hello <strong>there</strong>.</p><p><a href="https://atlvs.pro/x">Open it</a></p>`,
    );
    expect(text).toContain("Big News");
    expect(text).toContain("Hello there.");
    expect(text).toContain("Open it (https://atlvs.pro/x)");
    expect(text).not.toMatch(/<[a-z]/i);
  });

  it("drops hidden preheader blocks and decodes entities", () => {
    const text = htmlToText(
      `<div style="display:none;max-height:0;">SNIPPET${"&#8203;&nbsp;".repeat(3)}</div><p>Tom &amp; Jerry&#39;s &quot;deal&quot;</p>`,
    );
    expect(text).not.toContain("SNIPPET");
    expect(text).toContain(`Tom & Jerry's "deal"`);
  });
});
