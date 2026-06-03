"use client";

import type { CatalogKind, DocDeliverableType, ProposalBlock } from "@/lib/proposals/types";

// Inline lineage editor for phase + investment_table blocks. Surfaces
// the seeding-relevant fields (deliverableType, catalogKind/Code,
// budgetCategory) in outline mode so authors don't have to dive into
// the JSON tab to make a proposal seedable. Free-form labels remain
// editable; the optional lineage fields just add the hints the
// convert-to-project seeder consumes.

const CATALOG_KINDS: CatalogKind[] = [
  "credential",
  "catering",
  "radio",
  "tool",
  "equipment",
  "uniform",
  "travel",
  "lodging",
  "vehicle",
];

const DELIVERABLE_TYPES: DocDeliverableType[] = [
  "technical_rider",
  "hospitality_rider",
  "input_list",
  "stage_plot",
  "crew_list",
  "guest_list",
  "equipment_pull_list",
  "power_plan",
  "rigging_plan",
  "site_plan",
  "build_schedule",
  "vendor_package",
  "safety_compliance",
  "comms_plan",
  "signage_grid",
  "custom",
];

type AnyBlock = ProposalBlock & { _dragId?: string };

export function LineagePanel({ block, onChange }: { block: AnyBlock; onChange: (next: AnyBlock) => void }) {
  if (block.type === "phase") {
    const deliverables = block.deliverables ?? [];
    type PhaseItem = NonNullable<(typeof block)["items"]>[number];
    const items: PhaseItem[] = block.items ?? [];
    return (
      <div className="surface-inset mt-2 space-y-3 p-3">
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Deliverables · seeded into public.deliverables
          </div>
          {deliverables.length === 0 ? (
            <div className="mt-1 text-xs text-[var(--text-muted)]">No deliverables.</div>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              {deliverables.map((d, i) => (
                <div key={i} className="grid grid-cols-[1fr_180px] gap-2">
                  <input
                    className="input-base text-xs"
                    value={d.label}
                    onChange={(e) => {
                      const next = [...deliverables];
                      next[i] = { ...next[i], label: e.target.value };
                      onChange({ ...block, deliverables: next });
                    }}
                    placeholder="Deliverable label"
                  />
                  <select
                    className="input-base text-xs"
                    value={d.deliverableType ?? ""}
                    onChange={(e) => {
                      const next = [...deliverables];
                      const v = e.target.value;
                      next[i] = {
                        ...next[i],
                        deliverableType: v ? (v as DocDeliverableType) : undefined,
                      };
                      onChange({ ...block, deliverables: next });
                    }}
                  >
                    <option value="">— no type (won't seed) —</option>
                    {DELIVERABLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Catalog items · seeded into public.master_catalog_items
          </div>
          {items.length === 0 ? (
            <div className="mt-1 text-xs text-[var(--text-muted)]">No items.</div>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_140px] gap-2">
                  <input
                    className="input-base text-xs"
                    value={it.label}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], label: e.target.value };
                      onChange({ ...block, items: next });
                    }}
                    placeholder="Item label"
                  />
                  <input
                    className="input-base font-mono text-xs"
                    value={it.catalogCode ?? ""}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], catalogCode: e.target.value || undefined };
                      onChange({ ...block, items: next });
                    }}
                    placeholder="CODE"
                  />
                  <select
                    className="input-base text-xs"
                    value={it.catalogKind ?? ""}
                    onChange={(e) => {
                      const next = [...items];
                      const v = e.target.value;
                      next[i] = {
                        ...next[i],
                        catalogKind: v ? (v as CatalogKind) : undefined,
                      };
                      onChange({ ...block, items: next });
                    }}
                  >
                    <option value="">— no kind (won't seed) —</option>
                    {CATALOG_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === "investment_table") {
    return (
      <div className="surface-inset mt-2 space-y-2 p-3">
        <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Groups · seeded into public.budgets
        </div>
        {block.groups.map((g, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr] gap-2">
            <input
              className="input-base text-xs"
              value={g.label}
              onChange={(e) => {
                const next = [...block.groups];
                next[i] = { ...next[i], label: e.target.value };
                onChange({ ...block, groups: next });
              }}
              placeholder="Group label"
            />
            <input
              className="input-base text-xs"
              value={g.budgetCategory ?? ""}
              onChange={(e) => {
                const next = [...block.groups];
                next[i] = { ...next[i], budgetCategory: e.target.value || undefined };
                onChange({ ...block, groups: next });
              }}
              placeholder="Budget category (defaults to label)"
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export const LINEAGE_BLOCK_TYPES = ["phase", "investment_table"] as const;
export const isLineageBlock = (t: string) => (LINEAGE_BLOCK_TYPES as readonly string[]).includes(t);
