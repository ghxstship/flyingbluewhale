import { describe, expect, it, vi } from "vitest";
import {
  computeEnforcementDiff,
  computeHolders,
  isUserGrantLive,
  type HoldersInput,
  type MemberInput,
  type UserGrantInput,
} from "./holders";
import { slugifyRole } from "./slugify-role";

vi.mock("server-only", () => ({}));

/**
 * Pins the console-side mirror of capability resolution (holders.ts) — the
 * engine under both the "who holds what" view and the P2.4 enforcement-flip
 * preview. If these drift from what `can()` + `resolveGrants` decide on a
 * live request, the preview lies, and an admin flips the switch on the
 * strength of a lie.
 */

const NOW = new Date("2026-07-17T20:00:00Z");

const warehouseRoleId = "11111111-1111-4111-8111-111111111111";

function member(over: Partial<MemberInput> & Pick<MemberInput, "userId" | "email">): MemberInput {
  return { role: "member", persona: "crew", ...over };
}

function baseInput(over: Partial<HoldersInput>): HoldersInput {
  return {
    members: [],
    crewRoleIdsByUser: new Map(),
    roleNameById: new Map([[warehouseRoleId, "Warehouse"]]),
    roleGrants: [],
    userGrants: [],
    enforced: false,
    now: NOW,
    ...over,
  };
}

function grant(over: Partial<UserGrantInput> & Pick<UserGrantInput, "userId" | "capability">): UserGrantInput {
  return { validFrom: null, validUntil: null, revokedAt: null, ...over };
}

function holdingsOf(rows: ReturnType<typeof computeHolders>, userId: string) {
  const row = rows.find((r) => r.userId === userId);
  if (!row) throw new Error(`no holder row for ${userId}`);
  const byCap = new Map(row.holdings.map((h) => [h.capability as string, h]));
  return {
    caps: [...byCap.keys()],
    get(cap: string) {
      const h = byCap.get(cap);
      if (!h) throw new Error(`no holding for ${cap}`);
      return h;
    },
  };
}

describe("computeHolders", () => {
  it("grandfathered crew hold every scan capability via the legacy blanket, and nothing else", () => {
    const rows = computeHolders(
      baseInput({ members: [member({ userId: "u-crew", email: "crew@x.test" })], enforced: false }),
    );
    const h = holdingsOf(rows, "u-crew");
    for (const cap of ["scan:credential", "scan:asset", "scan:product", "scan:document"] as const) {
      expect(h.get(cap).held, cap).toBe(true);
      expect(h.get(cap).via, cap).toBe("blanket");
    }
    expect(h.get("asset:custody").held).toBe(false);
  });

  it("enforced crew hold nothing without grants", () => {
    const rows = computeHolders(
      baseInput({ members: [member({ userId: "u-crew", email: "crew@x.test" })], enforced: true }),
    );
    const h = holdingsOf(rows, "u-crew");
    for (const cap of h.caps) expect(h.get(cap).held, cap).toBe(false);
  });

  it("a role grant reaches the crew member through their catalogued role, attributed to the role", () => {
    const rows = computeHolders(
      baseInput({
        members: [member({ userId: "u-crew", email: "crew@x.test" })],
        crewRoleIdsByUser: new Map([["u-crew", [warehouseRoleId]]]),
        roleGrants: [{ crewRoleId: warehouseRoleId, capability: "scan:asset", shiftDerivable: true }],
        enforced: true,
      }),
    );
    const row = rows.find((r) => r.userId === "u-crew");
    const h = holdingsOf(rows, "u-crew");
    expect(h.get("scan:asset")).toMatchObject({ held: true, via: "role" });
    expect(h.get("scan:credential").held).toBe(false);
    expect(row?.grantingRoles).toEqual(["Warehouse"]);
  });

  it("an explicit grant outranks the blanket in attribution — it survives the flip, so it is the truer answer", () => {
    const rows = computeHolders(
      baseInput({
        members: [member({ userId: "u-crew", email: "crew@x.test" })],
        userGrants: [grant({ userId: "u-crew", capability: "scan:asset" })],
        enforced: false,
      }),
    );
    const h = holdingsOf(rows, "u-crew");
    expect(h.get("scan:asset").via).toBe("person");
    expect(h.get("scan:credential").via).toBe("blanket");
  });

  it("owner and admin hold everything via the base floor, whatever the tables say", () => {
    const rows = computeHolders(
      baseInput({
        members: [member({ userId: "u-own", email: "own@x.test", role: "owner", persona: "owner" })],
        enforced: true,
      }),
    );
    const h = holdingsOf(rows, "u-own");
    for (const cap of h.caps) {
      expect(h.get(cap).held, cap).toBe(true);
      expect(h.get(cap).via, cap).toBe("base");
    }
  });

  it("a client persona never had the blanket — the floor has no check-in", () => {
    const rows = computeHolders(
      baseInput({
        members: [member({ userId: "u-cli", email: "cli@x.test", role: "member", persona: "client" })],
        enforced: false,
      }),
    );
    const h = holdingsOf(rows, "u-cli");
    for (const cap of h.caps) expect(h.get(cap).held, cap).toBe(false);
  });
});

describe("isUserGrantLive — the time-boxed cover-shift window", () => {
  const cap = { userId: "u", capability: "scan:asset" };
  it("no bounds means live", () => {
    expect(isUserGrantLive(grant(cap), NOW)).toBe(true);
  });
  it("live inside the window, half-open at the end like the SQL", () => {
    const g = grant({ ...cap, validFrom: "2026-07-17T18:00:00Z", validUntil: "2026-07-18T02:00:00Z" });
    expect(isUserGrantLive(g, NOW)).toBe(true);
    expect(isUserGrantLive(g, new Date("2026-07-18T02:00:00Z"))).toBe(false); // valid_until > now(), exclusive
    expect(isUserGrantLive(g, new Date("2026-07-17T17:59:59Z"))).toBe(false);
  });
  it("a revoked grant is dead whatever its window says", () => {
    expect(isUserGrantLive(grant({ ...cap, revokedAt: "2026-07-16T00:00:00Z" }), NOW)).toBe(false);
  });
});

describe("computeEnforcementDiff — the P2.4 preview", () => {
  it("a blanket-only crew member loses every scan capability; a granted one keeps what is granted", () => {
    const diff = computeEnforcementDiff({
      members: [
        member({ userId: "u-bare", email: "bare@x.test" }),
        member({ userId: "u-granted", email: "granted@x.test" }),
      ],
      crewRoleIdsByUser: new Map([["u-granted", [warehouseRoleId]]]),
      roleNameById: new Map([[warehouseRoleId, "Warehouse"]]),
      roleGrants: [{ crewRoleId: warehouseRoleId, capability: "scan:asset", shiftDerivable: false }],
      userGrants: [],
      now: NOW,
    });

    const bare = diff.find((d) => d.userId === "u-bare");
    expect(bare?.loses).toEqual(["scan:credential", "scan:asset", "scan:product", "scan:document"]);
    expect(bare?.post).toEqual([]);

    const granted = diff.find((d) => d.userId === "u-granted");
    expect(granted?.post).toEqual(["scan:asset"]);
    expect(granted?.loses).toEqual(["scan:credential", "scan:product", "scan:document"]);
  });

  it("owners lose nothing, and a lapsed personal grant does not count as coverage", () => {
    const diff = computeEnforcementDiff({
      members: [
        member({ userId: "u-own", email: "own@x.test", role: "owner", persona: "owner" }),
        member({ userId: "u-lapsed", email: "lapsed@x.test" }),
      ],
      crewRoleIdsByUser: new Map(),
      roleNameById: new Map(),
      roleGrants: [],
      userGrants: [
        grant({
          userId: "u-lapsed",
          capability: "scan:asset",
          validFrom: "2026-07-01T00:00:00Z",
          validUntil: "2026-07-02T00:00:00Z",
        }),
      ],
      now: NOW,
    });
    expect(diff.find((d) => d.userId === "u-own")?.loses).toEqual([]);
    expect(diff.find((d) => d.userId === "u-lapsed")?.loses).toContain("scan:asset");
  });

  it("a scan:* wildcard grant covers every scan capability through the real matcher", () => {
    const diff = computeEnforcementDiff({
      members: [member({ userId: "u-wild", email: "wild@x.test" })],
      crewRoleIdsByUser: new Map(),
      roleNameById: new Map(),
      roleGrants: [],
      userGrants: [grant({ userId: "u-wild", capability: "scan:*" })],
      now: NOW,
    });
    expect(diff[0]?.loses).toEqual([]);
  });
});

describe("slugifyRole — the TS mirror of public.slugify_role()", () => {
  it("normalizes case, separators and punctuation, never fuzzy", () => {
    expect(slugifyRole("Stage Manager")).toBe("stage-manager");
    // The em-dash variant stays a DIFFERENT slug — merging is an operator call.
    expect(slugifyRole("Stage Manager — cosmicMEADOW")).toBe("stage-manager-cosmicmeadow");
    expect(slugifyRole("A1 / Programmer")).toBe("a1-programmer");
    expect(slugifyRole("credentials-travel-logistics")).toBe("credentials-travel-logistics");
  });
  it("treats non-ASCII letters as separators, exactly like the SQL (no unaccent)", () => {
    expect(slugifyRole("Café")).toBe("caf");
  });
  it("returns empty for names with nothing to key on", () => {
    expect(slugifyRole("—–!!")).toBe("");
  });
});
