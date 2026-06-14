/**
 * LEG3ND Knowledge — Resources Hub.
 *
 * Single helper file for the resources + collections module (migration
 * PENDING_legend_resources_hub). A curated library of resources grouped by
 * collection — mirrors a knowledge / resource library. Pattern matches
 * `src/lib/discounts_promoters.ts` / `src/lib/connecteam.ts`: enum tuples
 * `as const` → derived types → label maps + small pure helpers.
 */

// ============================================================
// Resource kind (taxonomy — not a lifecycle, keeps `kind`)
// ============================================================
export const RESOURCE_KINDS = ["link", "document", "template", "video", "reference"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  link: "Link",
  document: "Document",
  template: "Template",
  video: "Video",
  reference: "Reference",
};

// ============================================================
// Resource lifecycle (cyclical operational → `resource_state`)
// ============================================================
export const RESOURCE_STATES = ["draft", "published", "archived"] as const;
export type ResourceState = (typeof RESOURCE_STATES)[number];

export const RESOURCE_STATE_LABELS: Record<ResourceState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

// ============================================================
// Row shapes (hand-written until types regen — LooseSupabase reads)
// ============================================================
export type ResourceCollection = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: string;
  org_id: string;
  collection_id: string | null;
  title: string;
  description: string | null;
  kind: ResourceKind;
  url: string | null;
  file_path: string | null;
  resource_state: ResourceState;
  tags: string[];
  created_at: string;
  updated_at: string;
};

// ============================================================
// Helpers
// ============================================================

/** Parse a comma-separated tag input into a normalized, de-duplicated list:
 *  trimmed, lowercased, blanks dropped, order preserved. */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const tag = part.trim().toLowerCase();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

/** Render a tag list back into the comma-separated form an input expects. */
export function formatTags(tags: string[] | null | undefined): string {
  return (tags ?? []).join(", ");
}

/** The single best link target for a resource: prefer an explicit `url`,
 *  fall back to a stored `file_path` pointer. Null when neither is set. */
export function resourceTarget(resource: Pick<Resource, "url" | "file_path">): string | null {
  return resource.url || resource.file_path || null;
}

/**
 * Group resources by their collection id for the grouped hub view. Returns
 * an ordered list of { collection, resources } buckets following the given
 * collection order, with any collection-less resources collected into a
 * trailing `null`-keyed "Ungrouped" bucket. Empty collections are kept so
 * the hub can show them with their own empty state.
 */
export function groupByCollection(
  collections: ResourceCollection[],
  resources: Resource[],
): Array<{ collection: ResourceCollection | null; resources: Resource[] }> {
  const buckets = new Map<string | null, Resource[]>();
  for (const c of collections) buckets.set(c.id, []);
  buckets.set(null, []);
  for (const r of resources) {
    const key = r.collection_id && buckets.has(r.collection_id) ? r.collection_id : null;
    buckets.get(key)!.push(r);
  }
  const ordered: Array<{ collection: ResourceCollection | null; resources: Resource[] }> = [];
  for (const c of collections) {
    ordered.push({ collection: c, resources: buckets.get(c.id) ?? [] });
  }
  const ungrouped = buckets.get(null) ?? [];
  if (ungrouped.length > 0) ordered.push({ collection: null, resources: ungrouped });
  return ordered;
}
