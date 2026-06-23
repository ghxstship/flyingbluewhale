/**
 * Default breadcrumb derivation — pure helper, importable from server or
 * client. When a console page doesn't pass an explicit `breadcrumbs`
 * prop to `ModuleHeader`, the trail is derived from the current pathname
 * against the nav tree in `src/lib/nav.ts`: the deepest nav entry whose
 * href matches anchors the trail (group/section labels lead in), and any
 * remaining path segments get humanized fallbacks (dynamic id segments
 * render as "Detail").
 *
 * Pages that pass `breadcrumbs` keep their explicit, data-aware trails —
 * this is only the floor under the ~540 pages that never wired one.
 */
import { platformNavDomain, settingsNav, type NavGroup } from "@/lib/nav";
import { matchRoute } from "@/lib/match-route";

export type DerivedCrumb = { label: string; href?: string };

type NavAnchor = { href: string; label: string; group: string; section?: string };

let cachedAnchors: NavAnchor[] | null = null;

function stripQuery(href: string): string {
  const q = href.indexOf("?");
  return q === -1 ? href : href.slice(0, q);
}

function navAnchors(): NavAnchor[] {
  if (cachedAnchors) return cachedAnchors;
  const anchors: NavAnchor[] = [];
  const walk = (groups: NavGroup[]) => {
    for (const group of groups) {
      for (const item of group.items) {
        anchors.push({ href: stripQuery(item.href), label: item.label, group: group.label });
      }
      for (const section of group.sections ?? []) {
        for (const item of section.items) {
          anchors.push({ href: stripQuery(item.href), label: item.label, group: group.label, section: section.label });
        }
      }
    }
  };
  walk(platformNavDomain);
  walk(settingsNav);
  // Longest href first so the deepest nav entry wins the anchor match.
  anchors.sort((a, b) => b.href.length - a.href.length);
  cachedAnchors = anchors;
  return anchors;
}

/** UUIDs, long hashes, and numeric ids — segments that carry no readable
 *  name. They humanize to "Detail" rather than echoing the raw id. */
const ID_SEGMENT = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{16,}|\d{4,})$/i;

export function humanizeSegment(segment: string): string {
  const decoded = decodeURIComponent(segment);
  if (ID_SEGMENT.test(decoded)) return "Detail";
  return decoded
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Derive a default breadcrumb trail for a console pathname. Returns an
 * empty array outside `/studio` and on the console root; callers should
 * skip rendering trails shorter than two entries — a single-item trail
 * just repeats the page title.
 */
export function deriveBreadcrumbs(pathname: string): DerivedCrumb[] {
  const path = stripQuery(pathname);
  if (!path.startsWith("/studio") || path === "/studio") return [];

  const anchor = navAnchors().find((a) => matchRoute(path, a.href).isActive);
  const crumbs: DerivedCrumb[] = [];
  let consumed = "/studio";
  if (anchor) {
    if (anchor.group !== anchor.label) crumbs.push({ label: anchor.group });
    if (anchor.section && anchor.section !== anchor.group && anchor.section !== anchor.label) {
      crumbs.push({ label: anchor.section });
    }
    crumbs.push({ label: anchor.label, href: anchor.href });
    consumed = anchor.href;
  }

  let acc = consumed;
  for (const segment of path.slice(consumed.length).split("/")) {
    if (!segment) continue;
    acc += `/${segment}`;
    crumbs.push({ label: humanizeSegment(segment), href: acc });
  }
  return crumbs;
}
