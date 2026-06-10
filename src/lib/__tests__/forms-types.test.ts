import { describe, it, expect } from "vitest";
import {
  coerceFormSchema,
  evaluateCondition,
  isFieldVisible,
  isSectionVisible,
  type PublicFormField,
  type FormSection,
} from "@/lib/forms/types";

describe("coerceFormSchema", () => {
  it("normalizes a v1 flat schema", () => {
    const raw = { fields: [{ key: "name", label: "Name", type: "text", required: true }] };
    const s = coerceFormSchema(raw);
    expect(s.fields).toHaveLength(1);
    expect(s.fields[0]).toMatchObject({ key: "name", required: true });
    expect(s.version).toBe(1);
  });
  it("preserves v2 features", () => {
    const raw = {
      version: 2,
      sections: [{ id: "s1", heading: "Section 1" }],
      fields: [{ key: "k", label: "K", type: "text", section: "s1", conditions: [{ ifField: "x", value: "y" }] }],
      submit: { redirectUrl: "https://example.com/done" },
      antiSpam: { captcha: true },
    };
    const s = coerceFormSchema(raw);
    expect(s.version).toBe(2);
    expect(s.sections).toHaveLength(1);
    expect(s.fields[0]?.conditions).toHaveLength(1);
    expect(s.submit?.redirectUrl).toBe("https://example.com/done");
    expect(s.antiSpam?.captcha).toBe(true);
  });
  it("filters fields without key/label", () => {
    const raw = { fields: [{ type: "text" }, { key: "ok", label: "OK", type: "text" }] };
    const s = coerceFormSchema(raw);
    expect(s.fields).toHaveLength(1);
    expect(s.fields[0]?.key).toBe("ok");
  });
  it("returns empty fields for null/non-object", () => {
    expect(coerceFormSchema(null).fields).toEqual([]);
    expect(coerceFormSchema(42).fields).toEqual([]);
  });
});

describe("evaluateCondition", () => {
  it("eq matches", () => {
    expect(evaluateCondition({ ifField: "x", value: "a" }, { x: "a" })).toBe(true);
    expect(evaluateCondition({ ifField: "x", value: "a" }, { x: "b" })).toBe(false);
  });
  it("neq matches", () => {
    expect(evaluateCondition({ ifField: "x", op: "neq", value: "a" }, { x: "b" })).toBe(true);
    expect(evaluateCondition({ ifField: "x", op: "neq", value: "a" }, { x: "a" })).toBe(false);
  });
  it("in matches array", () => {
    expect(evaluateCondition({ ifField: "x", op: "in", value: ["a", "b"] }, { x: "a" })).toBe(true);
    expect(evaluateCondition({ ifField: "x", op: "in", value: ["a", "b"] }, { x: "c" })).toBe(false);
  });
  it("truthy / falsy", () => {
    expect(evaluateCondition({ ifField: "x", op: "truthy" }, { x: "yes" })).toBe(true);
    expect(evaluateCondition({ ifField: "x", op: "truthy" }, { x: "" })).toBe(false);
    expect(evaluateCondition({ ifField: "x", op: "falsy" }, { x: "" })).toBe(true);
    expect(evaluateCondition({ ifField: "x", op: "falsy" }, { x: "yes" })).toBe(false);
  });
});

describe("isFieldVisible", () => {
  const baseField: PublicFormField = { key: "k", label: "K", type: "text" };
  it("visible without conditions", () => {
    expect(isFieldVisible(baseField, {})).toBe(true);
  });
  it("hidden when condition fails", () => {
    const f: PublicFormField = { ...baseField, conditions: [{ ifField: "trigger", value: "y" }] };
    expect(isFieldVisible(f, { trigger: "n" })).toBe(false);
    expect(isFieldVisible(f, { trigger: "y" })).toBe(true);
  });
  it("AND-combines multiple conditions", () => {
    const f: PublicFormField = {
      ...baseField,
      conditions: [
        { ifField: "a", value: "1" },
        { ifField: "b", value: "2" },
      ],
    };
    expect(isFieldVisible(f, { a: "1", b: "2" })).toBe(true);
    expect(isFieldVisible(f, { a: "1", b: "x" })).toBe(false);
  });
});

describe("isSectionVisible", () => {
  const base: FormSection = { id: "s", heading: "S" };
  it("visible without conditions", () => {
    expect(isSectionVisible(base, {})).toBe(true);
  });
  it("hidden when section condition fails", () => {
    const s: FormSection = { ...base, conditions: [{ ifField: "type", value: "vendor" }] };
    expect(isSectionVisible(s, { type: "client" })).toBe(false);
    expect(isSectionVisible(s, { type: "vendor" })).toBe(true);
  });
});
