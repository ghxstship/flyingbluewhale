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
  it("operator personas route to /studio (owner/admin/manager)", () => {
    expect(resolveShell("owner")).toBe("/studio");
    expect(resolveShell("admin")).toBe("/studio");
    expect(resolveShell("manager")).toBe("/studio");
  });
  it("contributor personas route to /me (member/guest/visitor)", () => {
    // member is an applicant/contributor (talent, crew, vendor candidate),
    // not an org operator — see resolveShell() comment in auth.ts.
    expect(resolveShell("member")).toBe("/me");
    expect(resolveShell("guest")).toBe("/me");
    expect(resolveShell("visitor")).toBe("/me");
  });
  it("operator-adjacent personas route to /studio (collaborator)", () => {
    // collaborator is the co-producer persona — has project-write authority
    // even though they're not an admin. Their workflow is in /studio.
    expect(resolveShell("collaborator")).toBe("/studio");
  });
  it("portal personas route to /p (client receives proposals; contractor vendor-side)", () => {
    expect(resolveShell("client")).toBe("/p");
    expect(resolveShell("contractor")).toBe("/p");
  });
  it("field persona routes to /m (crew runs gates, scans, shifts)", () => {
    expect(resolveShell("crew")).toBe("/m");
  });
  it("pure-consumer personas route to /me (viewer/community)", () => {
    expect(resolveShell("viewer")).toBe("/me");
    expect(resolveShell("community")).toBe("/me");
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
  it("owner/admin have wildcard (persona falls through to role map)", () => {
    expect(can(baseSession({ role: "owner", persona: "owner" }), "projects:delete")).toBe(true);
    expect(can(baseSession({ role: "admin", persona: "admin" }), "anything:goes")).toBe(true);
  });
  it("manager has projects + finance read/write but not billing", () => {
    const s = baseSession({ role: "manager", persona: "manager" });
    expect(can(s, "projects:write")).toBe(true);
    expect(can(s, "invoices:write")).toBe(true);
    expect(can(s, "procurement:read")).toBe(true);
    expect(can(s, "billing:read")).toBe(false);
  });
  it("member (default persona) can read projects + write tasks/time", () => {
    const s = baseSession({ role: "member", persona: "member" });
    expect(can(s, "projects:read")).toBe(true);
    expect(can(s, "tasks:write")).toBe(true);
    expect(can(s, "time:write")).toBe(true);
  });
  it("member cannot manage other people", () => {
    expect(can(baseSession({ role: "member", persona: "member" }), "people:write")).toBe(false);
  });
});

describe("can (per-persona overlay — Bug #13 / Workstream A1)", () => {
  // Every marketplace persona has role=member at the platform level. The
  // per-persona overlay is what differentiates them.
  const m = (persona: Session["persona"]) => baseSession({ role: "member", persona });

  it("collaborator has project + crew + scheduling write", () => {
    const s = m("collaborator");
    expect(can(s, "projects:write")).toBe(true);
    expect(can(s, "crew:write")).toBe(true);
    expect(can(s, "schedule:write")).toBe(true);
    // But no finance / procurement
    expect(can(s, "invoices:write")).toBe(false);
    expect(can(s, "procurement:write")).toBe(false);
    expect(can(s, "check-in:write")).toBe(false); // not a scanner
  });

  it("contractor has tasks + time, but no project-write or check-in", () => {
    const s = m("contractor");
    expect(can(s, "projects:read")).toBe(true);
    expect(can(s, "projects:write")).toBe(false);
    expect(can(s, "tasks:write")).toBe(true);
    expect(can(s, "time:write")).toBe(true);
    expect(can(s, "check-in:write")).toBe(false);
  });

  it("crew is the gate-scanner persona — check-in:* is the defining cap", () => {
    const s = m("crew");
    expect(can(s, "check-in:write")).toBe(true);
    expect(can(s, "check-in:read")).toBe(true);
    expect(can(s, "tasks:write")).toBe(true);
    expect(can(s, "time:write")).toBe(true);
    // No project / proposal / finance authority
    expect(can(s, "projects:write")).toBe(false);
    expect(can(s, "invoices:write")).toBe(false);
  });

  it("client reads proposals/deliverables/tasks + may approve (sign) proposals, not author them", () => {
    const s = m("client");
    expect(can(s, "proposals:read")).toBe(true);
    expect(can(s, "deliverables:read")).toBe(true);
    expect(can(s, "tasks:read")).toBe(true);
    // The client is the legitimate proposal SIGNER — see
    // portal-proposal-approve-canon.test.ts.
    expect(can(s, "proposals:approve")).toBe(true);
    // …but signing is not authoring: no proposals:write.
    expect(can(s, "proposals:write")).toBe(false);
    // Critical denials covered by capability-gating spec
    expect(can(s, "projects:write")).toBe(false);
    expect(can(s, "check-in:write")).toBe(false);
    expect(can(s, "invoices:write")).toBe(false);
  });

  it("viewer reads projects/tasks + may approve (counter-sign) proposals; no other writes", () => {
    const s = m("viewer");
    expect(can(s, "projects:read")).toBe(true);
    expect(can(s, "tasks:read")).toBe(true);
    // Secondary stakeholder signer on a shared client portal.
    expect(can(s, "proposals:approve")).toBe(true);
    expect(can(s, "proposals:write")).toBe(false);
    expect(can(s, "projects:write")).toBe(false);
    expect(can(s, "check-in:write")).toBe(false);
  });

  it("community has zero capabilities (public marketplace browser)", () => {
    const s = m("community");
    expect(can(s, "projects:read")).toBe(false);
    expect(can(s, "projects:write")).toBe(false);
    expect(can(s, "tasks:read")).toBe(false);
    expect(can(s, "check-in:write")).toBe(false);
  });

  it("falls back to role when persona has no overlay", () => {
    // A pre-migration row could have persona = role-as-string; the
    // role-based map then takes effect bit-for-bit.
    const s = baseSession({ role: "manager", persona: "manager" });
    expect(can(s, "procurement:write")).toBe(true);
  });
});
