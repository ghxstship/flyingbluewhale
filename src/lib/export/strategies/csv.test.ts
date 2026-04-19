/**
 * CSV strategy guards — Opportunity #8 / RFC 4180 conformance.
 */
import { describe, it, expect } from "vitest";
import { rowsToCsv } from "./csv";

describe("rowsToCsv", () => {
  const columns = [
    { key: "id", header: "id" },
    { key: "name", header: "name" },
    { key: "amount", header: "amount" },
  ];

  it("emits header row + rows separated by CRLF", () => {
    const out = rowsToCsv(
      [
        { id: 1, name: "one", amount: 10 },
        { id: 2, name: "two", amount: 20 },
      ],
      columns,
    );
    expect(out).toBe("id,name,amount\r\n1,one,10\r\n2,two,20\r\n");
  });

  it("quotes cells that contain commas", () => {
    const out = rowsToCsv([{ id: 1, name: "smith, alex", amount: 5 }], columns);
    expect(out).toContain(`"smith, alex"`);
  });

  it("escapes quotes by doubling them", () => {
    const out = rowsToCsv([{ id: 1, name: `say "hi"`, amount: 5 }], columns);
    expect(out).toContain(`"say ""hi"""`);
  });

  it("quotes cells that contain newlines", () => {
    const out = rowsToCsv([{ id: 1, name: "a\nb", amount: 5 }], columns);
    expect(out).toContain(`"a\nb"`);
  });

  it("renders null and undefined as empty cells", () => {
    const out = rowsToCsv([{ id: 1, name: null, amount: undefined }], columns);
    expect(out).toBe("id,name,amount\r\n1,,\r\n");
  });

  it("serializes Date values as ISO 8601", () => {
    const d = new Date("2026-04-19T10:00:00.000Z");
    const out = rowsToCsv([{ id: 1, name: "x", amount: d }], columns);
    expect(out).toContain("2026-04-19T10:00:00.000Z");
  });

  it("handles empty rows with just the header", () => {
    const out = rowsToCsv([], columns);
    expect(out).toBe("id,name,amount\r\n");
  });
});
