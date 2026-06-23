/**
 * Nav-label translator helpers — derive a stable i18n key from a NavItem's
 * href (or a NavGroup/Section's label) so the platform/portal/mobile
 * sidebars don't have to be touched whenever a label is added.
 *
 * Pattern:
 *   navItemKey({ href: "/studio/projects" })  →  "nav.console.projects"
 *   navItemKey({ href: "/p/[slug]/artist/advancing" })
 *                                              →  "nav.p.artist.advancing"
 *   navGroupKey({ label: "0 EXECUTIVE" })      →  "nav.group.0-executive"
 *
 * Renderers call:
 *   t(navItemKey(item), undefined, item.label)
 *
 * If the catalog has the key, the translation wins; if not, the English
 * `label` from the nav data is the fallback — UIs never flash dot-paths
 * while the catalog is being filled.
 *
 * An item / group / section can override the derived key by setting an
 * explicit `labelKey` on the data — useful when two routes share a label
 * but should translate differently in context (e.g. "Settings" in console
 * vs portal).
 */

type Slugged = { label: string; labelKey?: string; href?: string };

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Derive a nav-key for a NavItem with an href. Strips the dynamic-segment
 * brackets ([slug] → slug) so portal items keyed by persona path collapse
 * to a stable string. Honors an explicit `labelKey` if the item carries one.
 */
export function navItemKey(item: Slugged): string {
  if (item.labelKey) return item.labelKey;
  if (item.href) {
    const path = item.href
      .replace(/^\//, "")
      .replace(/\[[^\]]+\]/g, (m) => m.slice(1, -1))
      .replace(/\//g, ".")
      .replace(/-/g, "_");
    return `nav.${path}`;
  }
  return `nav.label.${slugify(item.label)}`;
}

/**
 * Derive a nav-key for a NavGroup or NavSection. Groups don't carry hrefs,
 * so the key is slugified from the label. Honors `labelKey` override.
 */
export function navGroupKey(group: Slugged): string {
  if (group.labelKey) return group.labelKey;
  return `nav.group.${slugify(group.label)}`;
}
