import "server-only";

/**
 * Resolve a (resource_table, resource_id) pair to the destination URL the
 * /share/[token] page should send the visitor to.
 *
 * For resource types whose public renderer is wired (proposals, guides), we
 * return the canonical public URL. For resource types whose renderer is NOT
 * wired yet (view_configs, dashboards, generic), we return the same /share
 * page with `?unlocked=1` so the page renders an inline placeholder.
 *
 * This matches the spec: share_links is the primitive; downstream phases
 * consume it.
 */
export function resolveResourceUrl(table: string, id: string, token: string): string {
  switch (table) {
    case "proposals":
      // Existing public proposal route accepts a token in its own table.
      // Until proposals are migrated to share_links, send to the inline
      // placeholder so we don't 404 the visitor.
      return `/share/${encodeURIComponent(token)}?unlocked=1&t=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`;
    case "view_configs":
    case "guides":
    case "event_guides":
    case "dashboards":
    default:
      return `/share/${encodeURIComponent(token)}?unlocked=1&t=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`;
  }
}
