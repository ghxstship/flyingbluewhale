import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToFormFields } from "../automations/zod-form";

describe("zodToFormFields", () => {
  it("handles flat object", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      active: z.boolean(),
    });
    const fields = zodToFormFields(schema);
    expect(fields).toHaveLength(3);
    const map = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(map.name?.type).toBe("text");
    expect(map.age?.type).toBe("number");
    expect(map.active?.type).toBe("boolean");
    expect(map.name?.required).toBe(true);
  });

  it("recognizes enum as select", () => {
    const schema = z.object({
      status: z.enum(["draft", "sent", "failed"]),
    });
    const fields = zodToFormFields(schema);
    expect(fields).toHaveLength(1);
    const f = fields[0]!;
    expect(f.type).toBe("select");
    expect(f.options).toEqual([
      { value: "draft", label: "Draft" },
      { value: "sent", label: "Sent" },
      { value: "failed", label: "Failed" },
    ]);
  });

  it("marks optional fields as not required", () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
      withDefault: z.string().default("hi"),
    });
    const fields = zodToFormFields(schema);
    const map = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(map.required?.required).toBe(true);
    expect(map.optional?.required).toBe(false);
    expect(map.nullable?.required).toBe(false);
    expect(map.withDefault?.required).toBe(false);
    expect(map.withDefault?.default).toBe("hi");
  });

  it("flattens one level of nesting", () => {
    const schema = z.object({
      to: z.object({
        email: z.string().email(),
        name: z.string(),
      }),
      subject: z.string(),
    });
    const fields = zodToFormFields(schema);
    const names = fields.map((f) => f.name);
    expect(names).toContain("to.email");
    expect(names).toContain("to.name");
    expect(names).toContain("subject");
    const email = fields.find((f) => f.name === "to.email");
    expect(email?.type).toBe("email");
  });

  it("recognizes string formats (email, url, uuid)", () => {
    const schema = z.object({
      email: z.string().email(),
      url: z.string().url(),
      id: z.string().uuid(),
      plain: z.string(),
    });
    const fields = zodToFormFields(schema);
    const map = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(map.email?.type).toBe("email");
    expect(map.url?.type).toBe("url");
    expect(map.id?.type).toBe("uuid");
    expect(map.plain?.type).toBe("text");
  });

  it("captures min/max from string and number checks", () => {
    const schema = z.object({
      title: z.string().min(1).max(100),
      count: z.number().min(0).max(50),
    });
    const fields = zodToFormFields(schema);
    const map = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(map.title?.min).toBe(1);
    expect(map.title?.max).toBe(100);
    expect(map.count?.min).toBe(0);
    expect(map.count?.max).toBe(50);
  });

  it("treats long-max strings as textarea", () => {
    const schema = z.object({ body: z.string().max(50000) });
    const fields = zodToFormFields(schema);
    expect(fields[0]?.type).toBe("textarea");
  });

  it("captures description from .describe()", () => {
    const schema = z.object({
      to: z.string().email().describe("Recipient address"),
    });
    const fields = zodToFormFields(schema);
    expect(fields[0]?.description).toBe("Recipient address");
  });

  it("falls back gracefully on unions (uses first option)", () => {
    const schema = z.object({
      to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
    });
    const fields = zodToFormFields(schema);
    expect(fields).toHaveLength(1);
    expect(fields[0]?.type).toBe("email");
  });

  it("handles humanized labels", () => {
    const schema = z.object({
      replyTo: z.string(),
      user_id: z.string(),
    });
    const fields = zodToFormFields(schema);
    const map = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(map.replyTo?.label).toBe("Reply To");
    expect(map.user_id?.label).toBe("User Id");
  });
});
