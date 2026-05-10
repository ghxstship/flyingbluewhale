import { describe, expect, it } from "vitest";
import { sanitizeHtml, sanitizeSearch, sanitizeSvg } from "./sanitize";

describe("sanitizeHtml", () => {
  it("strips <script> and event handlers but keeps allowed inline formatting", () => {
    const out = sanitizeHtml("<p>Hello <strong>world</strong><script>alert(1)</script></p>");
    expect(out).toBe("<p>Hello <strong>world</strong></p>");
  });

  it("strips on* event handlers", () => {
    const out = sanitizeHtml('<a href="/x" onclick="alert(1)">go</a>');
    expect(out).toContain('href="/x"');
    expect(out).not.toContain("onclick");
  });

  it("removes javascript: URIs from href", () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("sanitizeSvg", () => {
  it("strips <script> blocks", () => {
    const out = sanitizeSvg('<svg><script>alert(1)</script><path d="M0,0"/></svg>');
    expect(out).not.toContain("<script");
    expect(out).toContain('<path d="M0,0"/>');
  });

  it("strips on* event handlers (double-quoted)", () => {
    const out = sanitizeSvg('<svg onload="alert(1)"><path/></svg>');
    expect(out).not.toContain("onload");
    expect(out).toContain("<svg>");
  });

  it("strips on* event handlers (single-quoted)", () => {
    const out = sanitizeSvg("<svg onclick='evil()'><path/></svg>");
    expect(out).not.toContain("onclick");
  });

  it("strips javascript: URIs case-insensitively", () => {
    const out = sanitizeSvg('<svg><a xlink:href="JavaScript:alert(1)"/></svg>');
    expect(out.toLowerCase()).not.toContain("javascript:");
  });

  it("preserves valid path data even when adjacent to attacks", () => {
    const out = sanitizeSvg('<svg><script>x</script><path d="M0 0L10 10"/></svg>');
    expect(out).toContain('<path d="M0 0L10 10"/>');
  });

  it("is idempotent on already-clean input", () => {
    const clean = '<svg viewBox="0 0 24 24"><path d="M0 0L24 24"/></svg>';
    expect(sanitizeSvg(clean)).toBe(clean);
  });
});

describe("sanitizeSearch", () => {
  it("preserves alphanumerics, spaces, and harmless punctuation", () => {
    expect(sanitizeSearch("Miami Beach")).toBe("Miami Beach");
    expect(sanitizeSearch("AT&T HQ")).toBe("AT&T HQ");
    expect(sanitizeSearch("O'Hare")).toBe("O'Hare");
    expect(sanitizeSearch("hard-rock_cafe")).toBe("hard-rock_cafe");
  });

  it("strips PostgREST filter delimiters: comma, period, parens", () => {
    expect(sanitizeSearch("name.ilike.%x")).toBe("nameilikex");
    expect(sanitizeSearch("a,b,c")).toBe("abc");
    expect(sanitizeSearch("(a OR b)")).toBe("a OR b");
  });

  it("strips wildcard chars that would break the LIKE pattern", () => {
    expect(sanitizeSearch("foo%bar")).toBe("foobar");
    expect(sanitizeSearch("foo*bar")).toBe("foobar");
    expect(sanitizeSearch("foo_bar")).toBe("foo_bar"); // underscore IS allowed (legit place names)
  });

  it("caps length at 60 chars", () => {
    const long = "a".repeat(120);
    expect(sanitizeSearch(long)).toHaveLength(60);
  });

  it("returns empty string when input is non-allow-listed only", () => {
    expect(sanitizeSearch("...,,,()")).toBe("");
  });

  it("handles empty input", () => {
    expect(sanitizeSearch("")).toBe("");
  });

  it("blocks NUL + control chars commonly used in injection payloads", () => {
    expect(sanitizeSearch("foo\x00bar")).toBe("foobar");
    expect(sanitizeSearch("foo\nbar")).toBe("foobar");
  });
});
