import { describe, it, expect } from "vitest";
import {
  classOfPersona,
  dashboardTemplateForPersona,
  portalNav,
  superPersonaOf,
  SUPER_PERSONA_LABEL,
  XPMS_DASHBOARD_TEMPLATES,
  type PortalPersona,
} from "@/lib/nav";
import { XPMS_CLASSES, XPMS_PHASES, XPMS_ATOM_PHASES } from "@/lib/xpms";

/**
 * Validates ADR-0004 portal mapping invariants:
 *  - All 15 sub-personas resolve to a valid XPMS class code.
 *  - Each class code maps to a stable dashboard template slug.
 *  - The 8 XPMS phases are present in published order.
 *  - The 10 XPMS classes are present in published order.
 */

const ALL_PERSONAS: PortalPersona[] = [
  "promoter",
  "producer",
  "stakeholder",
  "artist",
  "athlete",
  "delegation",
  "client",
  "sponsor",
  "media",
  "vendor",
  "crew",
  "volunteer",
  "hospitality",
  "guest",
  "vip",
];

describe("XPMS portal mapping (ADR-0004)", () => {
  it("classOfPersona returns a valid XPMS class for every sub-persona", () => {
    for (const p of ALL_PERSONAS) {
      const code = classOfPersona(p);
      expect([0, 2, 3, 6, 7]).toContain(code);
    }
  });

  it("EXECUTIVE personas (0) map to executive dashboard", () => {
    expect(classOfPersona("promoter")).toBe(0);
    expect(classOfPersona("producer")).toBe(0);
    expect(classOfPersona("stakeholder")).toBe(0);
    expect(dashboardTemplateForPersona("promoter")).toBe("executive");
  });

  it("TALENT personas (2) map to talent dashboard", () => {
    expect(classOfPersona("artist")).toBe(2);
    expect(classOfPersona("athlete")).toBe(2);
    expect(classOfPersona("delegation")).toBe(2);
    expect(dashboardTemplateForPersona("artist")).toBe("talent");
  });

  it("MARKETING personas (3) map to marketing dashboard", () => {
    expect(classOfPersona("client")).toBe(3);
    expect(classOfPersona("sponsor")).toBe(3);
    expect(classOfPersona("media")).toBe(3);
    expect(dashboardTemplateForPersona("client")).toBe("marketing");
  });

  it("OPERATIONS personas (6) map to operations dashboard", () => {
    expect(classOfPersona("vendor")).toBe(6);
    expect(classOfPersona("crew")).toBe(6);
    expect(classOfPersona("volunteer")).toBe(6);
    expect(classOfPersona("hospitality")).toBe(6);
    expect(dashboardTemplateForPersona("vendor")).toBe("operations");
  });

  it("EXPERIENCE personas (7) map to experience dashboard", () => {
    expect(classOfPersona("guest")).toBe(7);
    expect(classOfPersona("vip")).toBe(7);
    expect(dashboardTemplateForPersona("guest")).toBe("experience");
  });

  it("XPMS_DASHBOARD_TEMPLATES has exactly 10 entries (1 per class)", () => {
    expect(Object.keys(XPMS_DASHBOARD_TEMPLATES)).toHaveLength(10);
    expect(XPMS_DASHBOARD_TEMPLATES[0]).toBe("executive");
    expect(XPMS_DASHBOARD_TEMPLATES[9]).toBe("technology");
  });

  it("XPMS_CLASSES is the 10-class spine in published order", () => {
    expect(XPMS_CLASSES).toHaveLength(10);
    expect(XPMS_CLASSES.map((c) => c.name)).toEqual([
      "EXECUTIVE",
      "CREATIVE",
      "TALENT",
      "MARKETING",
      "BUILD",
      "PRODUCTION",
      "OPERATIONS",
      "EXPERIENCE",
      "HOSPITALITY",
      "TECHNOLOGY",
    ]);
  });

  it("XPMS_PHASES is the XPMS 2.5 nine-gate project lifecycle in macro-arc order", () => {
    expect(XPMS_PHASES).toHaveLength(9);
    expect(XPMS_PHASES.map((p) => p.id)).toEqual([
      "Discover",
      "Design",
      "Advance",
      "Procure",
      "Build",
      "Install",
      "Operate",
      "Amplify",
      "Close",
    ]);
  });

  it("XPMS_ATOM_PHASES is the Eight Production Phases (atom-level axis)", () => {
    expect(XPMS_ATOM_PHASES).toHaveLength(8);
    expect(XPMS_ATOM_PHASES.map((p) => p.id)).toEqual([
      "discovery",
      "design",
      "advance",
      "procurement",
      "build",
      "install",
      "operate",
      "close",
    ]);
  });
});

describe("ADR-0005 super-persona collapse", () => {
  it("every sub-persona resolves to one of 4 super-personas", () => {
    for (const p of ALL_PERSONAS) {
      const sp = superPersonaOf(p);
      expect(["buyer", "talent", "workforce", "audience"]).toContain(sp);
    }
  });

  it("buyer = client/sponsor/promoter/stakeholder", () => {
    expect(superPersonaOf("client")).toBe("buyer");
    expect(superPersonaOf("sponsor")).toBe("buyer");
    expect(superPersonaOf("promoter")).toBe("buyer");
    expect(superPersonaOf("stakeholder")).toBe("buyer");
  });

  it("talent = artist/athlete/delegation/vip/hospitality/media/producer", () => {
    expect(superPersonaOf("artist")).toBe("talent");
    expect(superPersonaOf("athlete")).toBe("talent");
    expect(superPersonaOf("delegation")).toBe("talent");
    expect(superPersonaOf("vip")).toBe("talent");
    expect(superPersonaOf("hospitality")).toBe("talent");
    expect(superPersonaOf("media")).toBe("talent");
    expect(superPersonaOf("producer")).toBe("talent");
  });

  it("workforce = vendor/crew/volunteer", () => {
    expect(superPersonaOf("vendor")).toBe("workforce");
    expect(superPersonaOf("crew")).toBe("workforce");
    expect(superPersonaOf("volunteer")).toBe("workforce");
  });

  it("audience = guest", () => {
    expect(superPersonaOf("guest")).toBe("audience");
  });

  it("SUPER_PERSONA_LABEL covers all 4 super-personas in Title Case", () => {
    expect(SUPER_PERSONA_LABEL.buyer).toBe("Buyer");
    expect(SUPER_PERSONA_LABEL.talent).toBe("Talent");
    expect(SUPER_PERSONA_LABEL.workforce).toBe("Workforce");
    expect(SUPER_PERSONA_LABEL.audience).toBe("Audience");
  });

  it("portalNav returns a NavGroup with Workspace + persona sections", () => {
    for (const p of ALL_PERSONAS) {
      const group = portalNav("demo", p);
      expect(group.label).toBe(SUPER_PERSONA_LABEL[superPersonaOf(p)]);
      expect(group.sections).toBeDefined();
      // ADR-0008 Move 3 + Amendment 6: both Workforce-parity personas split
      // their persona section into Engagement + Operations to stay inside
      // Miller's ceiling — 3 sections total. Vendor split first at 14 items;
      // crew joined it at 12 via the data-driven SPLITS map. Every other
      // persona keeps the single persona section — 2 sections total. Section
      // sizes themselves are guarded by portal-rail-canon.test.ts.
      expect(group.sections).toHaveLength(p === "vendor" || p === "crew" ? 3 : 2);
      const [workspace, ...personaSections] = group.sections!;
      expect(workspace?.label).toBe("Workspace");
      // Workspace section is the shared set — same across every persona.
      // Calendar (project events) + Accreditation (badge self-service) lifted
      // here from orphaned persona-less routes during the IA-alignment pass;
      // Notifications (per-kind preference matrix) added in the C-31 pass;
      // Advancing (the kit-27 token-scoped packet surface, with an operator
      // outline preview for org members) added in the merge-engine pass.
      expect(workspace?.items).toHaveLength(10);
      expect(workspace?.items.map((i) => i.label)).toEqual([
        "Overview",
        "Guide",
        "Calendar",
        "Updates",
        "Inbox",
        "Tasks",
        "Messages",
        "Advancing",
        "Accreditation",
        "Notifications",
      ]);
      for (const section of personaSections) {
        expect(section.items.length).toBeGreaterThan(0);
      }
    }
  });
});
