import { describe, expect, it } from "vitest";
import { can, personaForRole, resolveShell } from "./auth";

describe("personaForRole", () => {
  it("owner → owner", () => { expect(personaForRole("owner")).toBe("owner"); });
  it("admin → admin", () => { expect(personaForRole("admin")).toBe("admin"); });
  it("controller → controller", () => { expect(personaForRole("controller")).toBe("controller"); });
  it("collaborator → project_manager", () => { expect(personaForRole("collaborator")).toBe("project_manager"); });
  it("contractor → vendor", () => { expect(personaForRole("contractor")).toBe("vendor"); });
  it("crew → crew", () => { expect(personaForRole("crew")).toBe("crew"); });
  it("client → client", () => { expect(personaForRole("client")).toBe("client"); });
  it("developer → developer", () => { expect(personaForRole("developer")).toBe("developer"); });
  it("viewer/community → guest", () => {
    expect(personaForRole("viewer")).toBe("guest");
    expect(personaForRole("community")).toBe("guest");
  });
});

describe("resolveShell", () => {
  it("internal personas route to /console", () => {
    expect(resolveShell("owner")).toBe("/console");
    expect(resolveShell("admin")).toBe("/console");
    expect(resolveShell("controller")).toBe("/console");
    expect(resolveShell("project_manager")).toBe("/console");
    expect(resolveShell("developer")).toBe("/console");
  });
  it("external personas route to /p", () => {
    expect(resolveShell("client")).toBe("/p");
    expect(resolveShell("vendor")).toBe("/p");
    expect(resolveShell("artist")).toBe("/p");
    expect(resolveShell("sponsor")).toBe("/p");
    expect(resolveShell("guest")).toBe("/p");
  });
  it("crew routes to /m", () => { expect(resolveShell("crew")).toBe("/m"); });
  it("visitor routes to /me", () => { expect(resolveShell("visitor")).toBe("/me"); });
});

describe("can (capability gating)", () => {
  const session = () =>
    ({ userId: "u", email: "x@y.z", orgId: "o", role: "admin", tier: "portal", persona: "admin" }) as unknown as NonNullable<Parameters<typeof can>[0]>;

  it("denies null session", () => {
    expect(can(null, "projects:read")).toBe(false);
  });
  it("owner/admin have wildcard", () => {
    expect(can({ ...session(), role: "owner" }, "projects:delete")).toBe(true);
    expect(can({ ...session(), role: "admin" }, "anything:goes")).toBe(true);
  });
  it("controller has finance/procurement", () => {
    const s = { ...session(), role: "controller" as const };
    expect(can(s, "invoices:create")).toBe(true);
    expect(can(s, "procurement:read")).toBe(true);
  });
  it("controller lacks AI", () => {
    expect(can({ ...session(), role: "controller" as const }, "ai:chat")).toBe(false);
  });
  it("crew can write time", () => {
    expect(can({ ...session(), role: "crew" as const }, "time:write")).toBe(true);
  });
  it("community role has no capabilities", () => {
    expect(can({ ...session(), role: "community" as const }, "projects:read")).toBe(false);
  });
});
