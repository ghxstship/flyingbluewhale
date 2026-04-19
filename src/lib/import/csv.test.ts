/**
 * CSV import guards — Opportunity #7.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseAndValidateCsv } from "./csv";

const Schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  role: z.string().max(120).optional(),
});

describe("parseAndValidateCsv", () => {
  it("parses valid rows against the schema", () => {
    const csv = `name,email,role\nAlex,alex@example.com,Producer\nBrittany,brittany@example.com,Stage manager\n`;
    const r = parseAndValidateCsv(csv, Schema);
    expect(r.valid).toHaveLength(2);
    expect(r.invalid).toHaveLength(0);
    expect(r.rowCount).toBe(2);
    expect(r.valid[0].name).toBe("Alex");
  });

  it("lowercases + trims headers", () => {
    const csv = `  Name , Email \nAlex,alex@example.com\n`;
    const r = parseAndValidateCsv(csv, Schema);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].name).toBe("Alex");
  });

  it("surfaces field-level errors for invalid rows with human row numbers", () => {
    const csv = `name,email\nAlex,not-an-email\n,second@example.com\n`;
    const r = parseAndValidateCsv(csv, Schema);
    expect(r.invalid).toHaveLength(2);
    expect(r.invalid[0].rowIdx).toBe(2); // row index accounts for header
    expect(r.invalid[0].errors.join(",")).toMatch(/email/);
    expect(r.invalid[1].errors.join(",")).toMatch(/name/);
  });

  it("treats empty optional fields as undefined", () => {
    const csv = `name,email,role\nAlex,,\n`;
    const r = parseAndValidateCsv(csv, Schema);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].email).toBeUndefined();
  });

  it("skips blank lines", () => {
    const csv = `name\nAlex\n\n\nBrittany\n`;
    const r = parseAndValidateCsv(csv, Schema);
    expect(r.valid).toHaveLength(2);
  });
});
