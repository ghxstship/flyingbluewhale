import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { EMPTY_DOC_SETTINGS, toDocSettingsMap } from "@/lib/documents/org-settings";
import {
  AUTHORED_FAMILIES,
  buildAdvanceItems,
  buildDeliverableItems,
  buildDocItems,
  buildEmailItems,
  buildFieldItems,
  buildGuideItems,
  buildInspectionItems,
  buildJobItems,
  buildNotificationItems,
  buildProjectItems,
  buildProposalItems,
  familyCreateHref,
  storesForFamily,
  TEMPLATE_FAMILIES,
  TEMPLATE_STORES,
} from "./library";

/**
 * L-P2 RATCHET — the unified template library must cover every template
 * family in the product.
 *
 * 1. Every `*_templates` / `*_presets` table that exists in the schema
 *    (scanned from supabase/migrations) must appear in TEMPLATE_STORES —
 *    either mapped to a library family or explicitly excluded with a reason.
 *    A new template store CANNOT ship without deciding whether it joins
 *    the library at /legend/hub/templates.
 * 2. All contracted families are present, each fed by at least one store,
 *    each with a working item builder and a creation route (or an honest
 *    null for the registry-fixed / captured-from-record families).
 * 3. The doc family covers the ENTIRE registry (counts vs source).
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function discoverTemplateStores(): Set<string> {
  const found = new Set<string>();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?"?(?:public"?\.)?"?([a-z0-9_]+_(?:templates|presets))"?/gi;
  for (const name of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"))) {
    const txt = readFileSync(join(MIGRATIONS_DIR, name), "utf8");
    for (const m of txt.matchAll(re)) found.add(m[1]!);
  }
  return found;
}

describe("unified template library ratchet (L-P2)", () => {
  it("every template store in the schema is registered in TEMPLATE_STORES (family or documented exclusion)", () => {
    const discovered = discoverTemplateStores();
    expect(discovered.size).toBeGreaterThanOrEqual(4);
    const unregistered = [...discovered].filter((table) => !(table in TEMPLATE_STORES));
    expect(
      unregistered,
      `New template store(s) ${unregistered.join(", ")} must join the unified library ` +
        `(map them to a family in src/lib/templates/library-shared.ts and render them at ` +
        `/legend/hub/templates) or be excluded there with a documented reason.`,
    ).toEqual([]);
  });

  it("registered stores that are not in the schema scan are only the code registry", () => {
    const discovered = discoverTemplateStores();
    const phantom = Object.keys(TEMPLATE_STORES).filter(
      (k) => !k.startsWith("registry:") && !discovered.has(k),
    );
    expect(phantom, `TEMPLATE_STORES entries with no backing table: ${phantom.join(", ")}`).toEqual([]);
  });

  it("covers all contracted families, each fed by at least one store", () => {
    expect([...TEMPLATE_FAMILIES]).toEqual([
      "doc",
      "job",
      "field",
      "advance",
      "guide",
      "proposal",
      "project",
      "inspection",
      "email",
      "deliverable",
      "notification",
    ]);
    for (const family of TEMPLATE_FAMILIES) {
      expect(storesForFamily(family).length, `family "${family}" has no backing store`).toBeGreaterThan(0);
    }
  });

  it("doc family covers the ENTIRE registry with real per-type meta", () => {
    const items = buildDocItems(EMPTY_DOC_SETTINGS);
    expect(items.length).toBe(DOC_TEMPLATES.length);
    expect(items.length).toBeGreaterThanOrEqual(29);
    for (const item of items) {
      expect(item.family).toBe("doc");
      expect(item.mergeFieldCount ?? 0, `${item.id} has no merge fields`).toBeGreaterThan(0);
      expect(item.enabled).toBe(true);
      expect(item.href).toContain(`/documents/${item.id}`);
      expect(item.searchText).toContain(item.title.toLowerCase());
    }
    // At least one type is record-backed (resolvers wired through).
    expect(items.some((i) => i.recordBacked)).toBe(true);
  });

  it("doc items honor org settings (disabled + default brand annotations)", () => {
    const first = DOC_TEMPLATES[0]!;
    const settings = toDocSettingsMap([
      { doc_type: first.id, enabled: false, default_brand: "white", notes: null },
    ]);
    const items = buildDocItems(settings);
    // Disabled types stay IN the library index (annotated), never dropped —
    // the library is the configurator surface.
    expect(items.length).toBe(DOC_TEMPLATES.length);
    const target = items.find((i) => i.id === first.id)!;
    expect(target.enabled).toBe(false);
    expect(target.defaultBrand).toBe("white");
  });

  it("job/field/advance builders produce items from source rows", () => {
    const job = buildJobItems([{ id: "j1", name: "Rigging Scope", trade: "rigging", stepCount: 7 }]);
    expect(job[0]).toMatchObject({ family: "job", stepCount: 7 });

    const field = buildFieldItems([
      { id: "f1", name: "Site Walk", category: "checklist", summary: null, useCount: 3 },
    ]);
    expect(field[0]).toMatchObject({ family: "field", useCount: 3, subtitle: "checklist" });

    const advance = buildAdvanceItems([{ audienceType: "vendor", sectionCount: 5 }]);
    expect(advance[0]).toMatchObject({ family: "advance", sectionCount: 5, title: "vendor" });
  });

  it("expansion builders (guide/proposal/project/inspection/email/deliverable/notification) produce items", () => {
    const guide = buildGuideItems([
      { id: "g1", name: "Artist KBYG", persona: "artist", description: null, templateState: "published" },
    ]);
    expect(guide[0]).toMatchObject({ family: "guide", state: "published", subtitle: "artist" });
    // Guide templates are managed inline in the library — no deep link.
    expect(guide[0]!.href).toBe("");

    const proposal = buildProposalItems([
      { id: "p1", name: "Festival SOW", scope: "general", isSystem: true, blockCount: 12 },
    ]);
    expect(proposal[0]).toMatchObject({ family: "proposal", system: true, blockCount: 12 });

    const project = buildProjectItems([
      { id: "pt1", name: "Arena Build", category: "event", tagline: null, isOfficial: true, enabled: true },
    ]);
    expect(project[0]).toMatchObject({ family: "project", system: true, subtitle: "event" });

    const inspection = buildInspectionItems([
      { id: "i1", name: "Rigging Pre-Show", category: "rigging", itemCount: 9 },
    ]);
    expect(inspection[0]).toMatchObject({ family: "inspection", stepCount: 9 });

    const email = buildEmailItems([{ id: "e1", slug: "proposal_sent", name: "Proposal Sent", isActive: true }]);
    expect(email[0]).toMatchObject({ family: "email", enabled: true, subtitle: "proposal_sent" });

    const deliverable = buildDeliverableItems([
      { id: "d1", name: "Stage Plot Spec", type: "stage_plot", isGlobal: false },
    ]);
    expect(deliverable[0]).toMatchObject({ family: "deliverable", system: false });
    expect(deliverable[0]!.href).toContain("/settings/deliverable-templates");

    const notification = buildNotificationItems([
      { id: "n1", templateKey: "assignment.state", channel: "push", version: 3, state: "active", isPlatform: true },
    ]);
    expect(notification[0]).toMatchObject({ family: "notification", version: 3, system: true, state: "active" });
  });

  it("authoring families have a creation route; captured/registry-fixed families are honestly null", () => {
    for (const family of TEMPLATE_FAMILIES) {
      if ((AUTHORED_FAMILIES as readonly string[]).includes(family)) {
        expect(familyCreateHref(family), `family "${family}" has no creation route`).toBeTruthy();
      } else {
        // doc: registry-fixed. guide: captured from a project guide.
        // proposal/project: seeded system rows + captured from records.
        // deliverable: seeded per-project. notification: platform-seeded.
        expect(familyCreateHref(family), `family "${family}" should not offer a blank-authoring route`).toBeNull();
      }
    }
  });
});
