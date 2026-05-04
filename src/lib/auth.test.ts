import { describe, expect, it } from "vitest";
import { can, isAdmin, isManagerPlus, personaForRole, resolveShell } from "./auth";
import type { Session } from "./auth";

const baseSession = (overrides: Partial<Session> = {}): Session => ({
  userId: "u",
  email: "x@y.z",
  orgId: "o",
  orgSlug: "acme",
  role: "admin",
  isDeveloper: false,
  tier: "access",
  persona: "admin",
  ...overrides,
});

describe("personaForRole", () => {
  it("identity-maps platform role → persona", () => {
    expect(personaForRole("owner")).toBe("owner");
    expect(personaForRole("admin")).toBe("admin");
    expect(personaForRole("manager")).toBe("manager");
    expect(personaForRole("member")).toBe("member");
  });
});

describe("resolveShell", () => {
  it("real-org personas route to /console", () => {
    expect(resolveShell("owner")).toBe("/console");
    expect(resolveShell("admin")).toBe("/console");
    expect(resolveShell("manager")).toBe("/console");
    expect(resolveShell("member")).toBe("/console");
  });
  it("guest routes to /me — demo-org-only viewer with no real org context", () => {
    expect(resolveShell("guest")).toBe("/me");
  });
  it("visitor routes to /me", () => {
    expect(resolveShell("visitor")).toBe("/me");
  });
});

describe("isAdmin / isManagerPlus", () => {
  it("isAdmin = owner | admin", () => {
    expect(isAdmin(baseSession({ role: "owner" }))).toBe(true);
    expect(isAdmin(baseSession({ role: "admin" }))).toBe(true);
    expect(isAdmin(baseSession({ role: "manager" }))).toBe(false);
    expect(isAdmin(baseSession({ role: "member" }))).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
  it("isManagerPlus = owner | admin | manager", () => {
    expect(isManagerPlus(baseSession({ role: "owner" }))).toBe(true);
    expect(isManagerPlus(baseSession({ role: "admin" }))).toBe(true);
    expect(isManagerPlus(baseSession({ role: "manager" }))).toBe(true);
    expect(isManagerPlus(baseSession({ role: "member" }))).toBe(false);
    expect(isManagerPlus(null)).toBe(false);
  });
});

describe("can (capability gating)", () => {
  it("denies null session", () => {
    expect(can(null, "projects:read")).toBe(false);
  });
  it("owner/admin have wildcard", () => {
    expect(can(baseSession({ role: "owner" }), "projects:delete")).toBe(true);
    expect(can(baseSession({ role: "admin" }), "anything:goes")).toBe(true);
  });
  it("manager has projects + finance read/write but not billing", () => {
    const s = baseSession({ role: "manager" });
    expect(can(s, "projects:write")).toBe(true);
    expect(can(s, "invoices:write")).toBe(true);
    expect(can(s, "procurement:read")).toBe(true);
    expect(can(s, "billing:read")).toBe(false);
  });
  it("member can read projects + write tasks/time", () => {
    const s = baseSession({ role: "member" });
    expect(can(s, "projects:read")).toBe(true);
    expect(can(s, "tasks:write")).toBe(true);
    expect(can(s, "time:write")).toBe(true);
  });
  it("member cannot manage other people", () => {
    expect(can(baseSession({ role: "member" }), "people:write")).toBe(false);
  });
});
