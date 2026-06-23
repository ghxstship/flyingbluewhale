import { describe, it, expect } from "vitest";
import {
  VIEW_SCOPES,
  VIEW_TYPES,
  isViewScope,
  isViewType,
  scopeLabel,
  type SavedView,
  type ViewConfigRow,
  type ViewScope,
  type ViewType,
} from "@/lib/views/types";

describe("SavedView shape", () => {
  it("accepts a minimal grid view", () => {
    const v: SavedView = { density: "compact" };
    expect(v.density).toBe("compact");
  });

  it("supports view-type-specific config under viewConfig", () => {
    const v: SavedView = { viewConfig: { laneField: "state" } };
    expect((v.viewConfig as Record<string, unknown>).laneField).toBe("state");
  });

  it("spotlight rules round-trip", () => {
    const v: SavedView = {
      spotlight: [{ when: "row.state === 'overdue'", tone: "error" }],
    };
    expect(v.spotlight![0]?.tone).toBe("error");
    expect(v.spotlight![0]?.when).toContain("overdue");
  });

  it("supports multi-key sort", () => {
    const v: SavedView = {
      sort: [
        { key: "priority", dir: "desc" },
        { key: "due_at", dir: "asc" },
      ],
    };
    expect(v.sort).toHaveLength(2);
    expect(v.sort![1]?.dir).toBe("asc");
  });

  it("supports per-column include-only filters", () => {
    const v: SavedView = {
      filters: { status: ["open", "in_progress"], priority: ["high"] },
    };
    expect(v.filters!.status).toContain("open");
    expect(v.filters!.priority).toEqual(["high"]);
  });

  it("supports group-by + collapsed groups", () => {
    const v: SavedView = { groupBy: "owner", collapsed: ["alice", "bob"] };
    expect(v.groupBy).toBe("owner");
    expect(v.collapsed).toContain("alice");
  });

  it("preserves column display state (hidden / pinned / order)", () => {
    const v: SavedView = {
      hidden: ["created_at"],
      pinned: ["name"],
      order: ["name", "status", "owner"],
    };
    expect(v.hidden).toEqual(["created_at"]);
    expect(v.pinned).toEqual(["name"]);
    expect(v.order?.[0]).toBe("name");
  });

  it("free-text query is plain string", () => {
    const v: SavedView = { query: "overdue rfi" };
    expect(typeof v.query).toBe("string");
  });
});

describe("ViewConfigRow shape", () => {
  it("normalises camelCase fields", () => {
    const row: ViewConfigRow = {
      id: "11111111-1111-1111-1111-111111111111",
      orgId: "22222222-2222-2222-2222-222222222222",
      tableId: "t:/studio/projects:id,name",
      type: "grid",
      scope: "org",
      name: "All Projects · Active",
      description: null,
      config: { density: "comfortable", filters: { status: ["active"] } },
      isDefault: false,
      isLocked: false,
      createdBy: "33333333-3333-3333-3333-333333333333",
      updatedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(row.scope).toBe("org");
    expect(row.config.density).toBe("comfortable");
    expect(row.isLocked).toBe(false);
  });
});

describe("scope + type guards", () => {
  it("VIEW_SCOPES enumerates all three scopes", () => {
    expect(VIEW_SCOPES).toEqual(["private", "org", "public"]);
  });

  it("VIEW_TYPES enumerates the nine view types", () => {
    expect(VIEW_TYPES).toContain("grid");
    expect(VIEW_TYPES).toContain("kanban");
    expect(VIEW_TYPES).toContain("calendar");
    expect(VIEW_TYPES).toHaveLength(9);
  });

  it("isViewScope narrows valid strings", () => {
    expect(isViewScope("private")).toBe(true);
    expect(isViewScope("org")).toBe(true);
    expect(isViewScope("public")).toBe(true);
    expect(isViewScope("everyone")).toBe(false);
    expect(isViewScope(42)).toBe(false);
    expect(isViewScope(null)).toBe(false);
  });

  it("isViewType narrows valid strings", () => {
    const valid: ViewType[] = ["grid", "kanban", "calendar", "timeline", "chart", "map", "gantt", "card", "form"];
    valid.forEach((t) => expect(isViewType(t)).toBe(true));
    expect(isViewType("spreadsheet")).toBe(false);
    expect(isViewType(undefined)).toBe(false);
  });

  it("scopeLabel returns the UI heading for each scope", () => {
    expect(scopeLabel("private")).toBe("My Views");
    expect(scopeLabel("org")).toBe("Shared");
    expect(scopeLabel("public")).toBe("Public");
  });

  it("ViewScope is a finite union — no holes", () => {
    const scopes: ViewScope[] = ["private", "org", "public"];
    expect(scopes).toEqual([...VIEW_SCOPES]);
  });
});
