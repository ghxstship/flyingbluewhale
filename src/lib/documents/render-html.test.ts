/**
 * HTML renderer guard — the string renderer must emit the same data-contract
 * surface as the React engine (data-doc, data-path merge fields, data-mf) and
 * must bind data passed in, falling back to sample copy otherwise.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDocTemplate } from "./registry";
import { renderDocHtml } from "./render-html";

describe("document html renderer", () => {
  const invoice = getDocTemplate("invoice")!;

  it("emits the .doc contract surface", () => {
    const html = renderDocHtml(invoice);
    expect(html).toContain('class="doc-stage"');
    expect(html).toContain('data-doc="invoice"');
    expect(html).toContain('data-path="invoice.number"');
    expect(html).toContain('data-mf="off"');
  });

  it("renders sample values when no data is bound", () => {
    const html = renderDocHtml(invoice);
    expect(html).toContain("INV-2049-03"); // the sample invoice number
  });

  it("binds provided data and falls back to sample for absent paths", () => {
    const html = renderDocHtml(invoice, {
      data: { invoice: { number: "INV-BOUND-1" }, client: { name: "Bound Co" } },
    });
    expect(html).toContain("INV-BOUND-1");
    expect(html).toContain("Bound Co");
    expect(html).not.toContain("INV-2049-03"); // bound number replaces the sample
  });

  it("escapes HTML in bound values (no injection)", () => {
    const html = renderDocHtml(invoice, { data: { invoice: { number: "<script>x</script>" } } });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("white-label brand mode is reflected on the wrapper", () => {
    const html = renderDocHtml(invoice, { brand: "white" });
    expect(html).toContain('data-brand="white"');
  });

  // README §0.2 — the wordmark must reflect the OWNING app, not a hardcoded
  // ATLVS. It is CSS-driven off --ob-name (per data-product), so the renderer
  // emits an EMPTY .doc-wm span + the correct data-product; kit-documents.css
  // resolves the app name via `.doc-wm::after{content:var(--ob-name)}`.
  it("cover wordmark is app-aware (empty span + correct data-product, no hardcoded ATLVS)", () => {
    const proposal = getDocTemplate("proposal")!; // atlvs, has a cover block
    const callsheet = getDocTemplate("callsheet")!; // compvss, accent cover
    const pHtml = renderDocHtml(proposal);
    const cHtml = renderDocHtml(callsheet);
    // No hardcoded literal wordmark baked into either renderer's cover.
    expect(pHtml).not.toContain("A T L V S");
    expect(pHtml).toContain('<span class="wm doc-wm"></span>');
    // The owning app drives the wordmark via data-product on the stage.
    expect(pHtml).toContain('data-product="atlvs"');
    expect(cHtml).toContain('data-product="compvss"');
  });
});

describe("kit-documents.css — app-aware wordmark wiring", () => {
  const css = readFileSync(join(process.cwd(), "src/app/theme/kit-documents.css"), "utf8");

  it("routes the cover wordmark through --ob-name (::after)", () => {
    expect(css).toMatch(/\.doc-wm::after\s*{\s*content:\s*var\(--ob-name\)\s*}/);
  });

  it("defaults --ob-name per owning app (compvss · gvteway · legend)", () => {
    for (const [product, name] of [
      ["compvss", "COMPVSS"],
      ["gvteway", "GVTEWAY"],
      ["legend", "LEG3ND"],
    ] as const) {
      const re = new RegExp(`\\[data-product="${product}"\\][^{]*\\{[^}]*--ob-name:\\s*"${name}"`);
      expect(re.test(css), `--ob-name default missing for ${product}`).toBe(true);
    }
  });
});
