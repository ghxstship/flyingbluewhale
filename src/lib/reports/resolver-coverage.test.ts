import { describe, it, expect, vi } from "vitest";

// One resolver module carries a `server-only` guard; neutralize it so this
// pure registry-coverage check can import the resolver maps in node.
vi.mock("server-only", () => ({}));

import { METRIC_IDS } from "./registry";
import { NOT_COMPUTED } from "./resolvers/types";
import { atlvsResolvers } from "./resolvers/atlvs";
import { compvssResolvers } from "./resolvers/compvss";
import { gvtewayResolvers } from "./resolvers/gvteway";
import { legendResolvers } from "./resolvers/legend";

const ALL: Record<string, unknown> = {
  ...atlvsResolvers,
  ...compvssResolvers,
  ...gvtewayResolvers,
  ...legendResolvers,
};
const registered = Object.keys(ALL);
const computed = registered.filter((id) => ALL[id] !== NOT_COMPUTED);

describe("reports resolver coverage (plumb-line RPT-5)", () => {
  it("every metric in the registry has a registered resolver entry", () => {
    const missing = METRIC_IDS.filter((id) => !(id in ALL));
    expect(missing, `metrics with no resolver: ${missing.join(", ")}`).toEqual([]);
  });

  it("has no orphan resolver without a metric definition", () => {
    const orphans = registered.filter((id) => !METRIC_IDS.includes(id));
    expect(orphans, `resolvers with no metric def: ${orphans.join(", ")}`).toEqual([]);
  });

  it("computes a real value for some — but not all — metrics (honest coverage)", () => {
    // Guards the `/metrics` `computed` flag: stubs are excluded, so this is a
    // strict subset. If it ever equals total, a NOT_COMPUTED stub was wired to
    // a real resolver without updating the metric's confidence/coverage story.
    expect(computed.length).toBeGreaterThan(0);
    expect(computed.length).toBeLessThan(registered.length);
  });
});
