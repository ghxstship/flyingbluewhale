/**
 * HTML renderer guard — the string renderer must emit the same data-contract
 * surface as the React engine (data-doc, data-path merge fields, data-mf) and
 * must bind data passed in, falling back to sample copy otherwise.
 */
import { describe, it, expect } from "vitest";
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
});
