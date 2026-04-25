"use client";

import * as React from "react";
import { create as createDiff, type Delta } from "jsondiffpatch";

// Defaults are fine for our use case (audit log + version history).
// Skipping textDiff config because the diff_match_patch peer dep isn't
// pulled in — jsondiffpatch falls back to whole-string replacement.
const dp = createDiff({
  arrays: { detectMove: true, includeValueOnMove: false },
});

/**
 * DiffViewer — side-by-side before/after comparison for two JSON-like
 * objects. Used by the audit log and any version-history surface. Falls
 * back gracefully when one side is missing (created vs deleted rows).
 *
 * Designed for compliance / debugging contexts: the output is
 * field-by-field, scannable, with type-color cues (green = added,
 * red = removed, amber = changed). Modeled on Notion's audit panel and
 * GitHub's commit diff.
 */
export function DiffViewer({
  before,
  after,
  className = "",
  emptyLabel = "No changes",
}: {
  before: unknown;
  after: unknown;
  className?: string;
  emptyLabel?: string;
}) {
  const delta = React.useMemo<Delta | undefined>(() => {
    try {
      return dp.diff(before, after);
    } catch {
      return undefined;
    }
  }, [before, after]);

  if (!delta) {
    return <p className="text-xs text-[var(--text-muted)]">{emptyLabel}</p>;
  }

  const rows = flatten(delta as Record<string, unknown>);
  if (rows.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">{emptyLabel}</p>;
  }

  return (
    <div className={`overflow-hidden rounded-md border border-[var(--border-color)] ${className}`}>
      <table className="w-full text-xs">
        <thead className="bg-[var(--surface-inset)] text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <tr>
            <th className="px-3 py-1.5 text-start">Field</th>
            <th className="px-3 py-1.5 text-start">Before</th>
            <th className="px-3 py-1.5 text-start">After</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[var(--border-color)]">
              <td className="px-3 py-1.5 align-top font-mono text-[10px] text-[var(--text-secondary)]">
                {r.path}
              </td>
              <td className="px-3 py-1.5 align-top">
                {r.kind !== "added" ? (
                  <code
                    className={`break-all rounded px-1 py-0.5 ${
                      r.kind === "removed"
                        ? "bg-[color:var(--color-error)]/10 text-[color:var(--color-error)]"
                        : "bg-[color:var(--color-warning)]/10 text-[var(--text-secondary)]"
                    }`}
                  >
                    {fmt(r.before)}
                  </code>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </td>
              <td className="px-3 py-1.5 align-top">
                {r.kind !== "removed" ? (
                  <code
                    className={`break-all rounded px-1 py-0.5 ${
                      r.kind === "added"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-[color:var(--color-warning)]/10 text-[var(--text-primary)]"
                    }`}
                  >
                    {fmt(r.after)}
                  </code>
                ) : (
                  <span className="text-[var(--text-muted)]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FlatRow = {
  path: string;
  before: unknown;
  after: unknown;
  kind: "added" | "removed" | "changed";
};

/**
 * Convert a jsondiffpatch Delta into a flat list of [path, before, after, kind].
 * jsondiffpatch encodes:
 *   - added:    [newValue]
 *   - changed:  [oldValue, newValue]
 *   - removed:  [oldValue, 0, 0]
 *   - moved:    [' ', destIdx, 3]
 */
function flatten(delta: Record<string, unknown>, prefix = ""): FlatRow[] {
  const out: FlatRow[] = [];
  for (const key of Object.keys(delta)) {
    if (key === "_t") continue; // jsondiffpatch array marker
    const value = delta[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      if (value.length === 1) {
        out.push({ path, before: undefined, after: value[0], kind: "added" });
      } else if (value.length === 2) {
        out.push({ path, before: value[0], after: value[1], kind: "changed" });
      } else if (value.length === 3 && value[1] === 0 && value[2] === 0) {
        out.push({ path, before: value[0], after: undefined, kind: "removed" });
      }
    } else if (value && typeof value === "object") {
      out.push(...flatten(value as Record<string, unknown>, path));
    }
  }
  return out;
}

function fmt(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string") return v.length > 200 ? v.slice(0, 200) + "…" : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}
