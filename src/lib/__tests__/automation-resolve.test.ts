import { describe, it, expect } from "vitest";
import { resolveTemplate } from "../automations/resolve";

describe("resolveTemplate", () => {
  it("substitutes simple placeholder", () => {
    expect(resolveTemplate("{{trigger.name}}", { trigger: { name: "Acme" }, steps: [] })).toBe("Acme");
  });

  it("preserves type for whole-string match (number)", () => {
    expect(resolveTemplate("{{trigger.amount}}", { trigger: { amount: 42 }, steps: [] })).toBe(42);
  });

  it("preserves type for whole-string match (boolean)", () => {
    expect(resolveTemplate("{{trigger.flag}}", { trigger: { flag: true }, steps: [] })).toBe(true);
  });

  it("preserves type for whole-string match (object)", () => {
    expect(resolveTemplate("{{trigger.record}}", { trigger: { record: { id: "x" } }, steps: [] })).toEqual({ id: "x" });
  });

  it("interpolates partial templates", () => {
    expect(resolveTemplate("Hello {{trigger.name}}", { trigger: { name: "Acme" }, steps: [] })).toBe("Hello Acme");
  });

  it("interpolates multiple placeholders in one string", () => {
    expect(
      resolveTemplate("{{trigger.first}} {{trigger.last}}", {
        trigger: { first: "Jane", last: "Doe" },
        steps: [],
      }),
    ).toBe("Jane Doe");
  });

  it("walks step output by index", () => {
    expect(
      resolveTemplate("{{step.0.output.id}}", {
        trigger: {},
        steps: [{ output: { id: "abc" } }],
      }),
    ).toBe("abc");
  });

  it("supports bracket notation", () => {
    expect(
      resolveTemplate("{{step[1].output.email}}", {
        trigger: {},
        steps: [{ output: { email: "a@b.com" } }, { output: { email: "c@d.com" } }],
      }),
    ).toBe("c@d.com");
  });

  it("returns undefined for unknown paths (whole-string)", () => {
    expect(resolveTemplate("{{trigger.missing}}", { trigger: {}, steps: [] })).toBeUndefined();
  });

  it("renders unknown paths as empty string in partial templates", () => {
    expect(resolveTemplate("Hi {{trigger.name}}!", { trigger: {}, steps: [] })).toBe("Hi !");
  });

  it("preserves objects and walks nested fields", () => {
    expect(
      resolveTemplate({ to: "{{trigger.email}}", subject: "Hi" }, { trigger: { email: "a@b.com" }, steps: [] }),
    ).toEqual({ to: "a@b.com", subject: "Hi" });
  });

  it("preserves arrays and walks each element", () => {
    expect(resolveTemplate(["{{trigger.a}}", "{{trigger.b}}"], { trigger: { a: 1, b: 2 }, steps: [] })).toEqual([1, 2]);
  });

  it("leaves null and non-template strings alone", () => {
    expect(resolveTemplate(null, { trigger: {}, steps: [] })).toBe(null);
    expect(resolveTemplate("plain text", { trigger: {}, steps: [] })).toBe("plain text");
  });

  it("walks deep paths (object → object → field)", () => {
    expect(
      resolveTemplate("{{trigger.record.fields.title}}", {
        trigger: { record: { fields: { title: "Sea Trial" } } },
        steps: [],
      }),
    ).toBe("Sea Trial");
  });

  it("returns undefined when intermediate segment is missing", () => {
    expect(
      resolveTemplate("{{trigger.record.fields.title}}", {
        trigger: { record: null },
        steps: [],
      }),
    ).toBeUndefined();
  });

  it("ignores non-trigger / non-step roots", () => {
    expect(resolveTemplate("{{global.hax}}", { trigger: {}, steps: [] })).toBeUndefined();
  });

  it("handles nested objects with mixed templates", () => {
    expect(
      resolveTemplate(
        {
          to: "{{trigger.email}}",
          payload: { id: "{{step.0.output.id}}", greeting: "Hello {{trigger.name}}" },
        },
        { trigger: { email: "u@x.com", name: "Pat" }, steps: [{ output: { id: 99 } }] },
      ),
    ).toEqual({ to: "u@x.com", payload: { id: 99, greeting: "Hello Pat" } });
  });

  it("trims whitespace inside placeholders", () => {
    expect(resolveTemplate("{{ trigger.name }}", { trigger: { name: "ok" }, steps: [] })).toBe("ok");
  });
});
