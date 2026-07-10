import type { NavGroup, NavItem, NavSection } from "@/lib/nav";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { getRequestT } from "@/lib/i18n/request";
import { navGroupKey, navItemKey } from "@/lib/i18n/nav-label";
import { Wordmark } from "@/components/brand/Wordmark";
import { PortalRailNav, type PortalRailSection } from "@/components/PortalRailClient";

/**
 * Portal rail — extracted from `src/components/Shell.tsx` so the
 * `getRequestT` server-only import stays out of any Client Component
 * graph that pulls in Shell. Same contract, same behavior; just lives
 * in its own module. Shell.tsx re-exports it for backwards-compat.
 *
 * Accepts ADR-0005 super-persona-shaped `NavGroup` and renders sectioned
 * (Workspace + persona) when sections are present; falls back to flat
 * `items` for any caller passing the legacy shape.
 *
 * `title` overrides `group.label` — used by the shared
 * `/p/[slug]/{tasks,messages,inbox,announcements}` pages that need a
 * generic "Portal" label rather than a super-persona name.
 *
 * This server component translates the labels, then delegates rendering
 * to `PortalRailClient`: the desktop `<aside>` (hidden below `md`) and a
 * mobile drawer affordance carrying the same sections. Active state is
 * resolved client-side from `usePathname`, so `aria-current` works on
 * every portal page without callers threading a `currentPath` through
 * (the prop is kept for backwards-compat but no longer required).
 */
export async function PortalRail({
  group,
  items,
  title,
}: {
  group?: NavGroup;
  items?: NavItem[];
  title?: string;
  /** @deprecated Active state now derives from `usePathname` client-side. */
  currentPath?: string;
}) {
  const { t } = await getRequestT();
  const sections: NavSection[] = group?.sections?.length
    ? group.sections
    : group
      ? [{ label: group.label, items: group.items }]
      : [{ label: title ?? "", items: items ?? [] }];
  const headerTitle = title ?? (group ? t(navGroupKey(group), undefined, group.label) : "");
  // Translate server-side; the client half only receives plain strings.
  const translated: PortalRailSection[] = sections.map((section) => ({
    label: section.label ? t(navGroupKey(section), undefined, section.label) : "",
    items: section.items.map((i) => ({ href: i.href, label: t(navItemKey(i), undefined, i.label) })),
  }));
  // Below `md` the aside is hidden — the `/p/[slug]` layout mounts
  // `PortalMobileNav` (PortalRailClient.tsx) as the phone nav path.
  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-e border-[var(--p-border)] bg-[var(--p-surface)] p-3 md:flex">
        {/* Canonical SaaS brand row — blue-tiled Waypoint app-icon + spaced
            wordmark per ui_kits/atlvs/dashboard.html .brandrow. Per v5.1
            logo-kit canon, the GVTEWAY app icon is the Waypoint on blue. */}
        <div className="mb-3 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/atlvs-icon-gvteway.svg"
            alt=""
            width={28}
            height={28}
            aria-hidden="true"
            className="rounded-md"
          />
          <Wordmark word="GVTEWAY" style={{ color: "var(--p-accent)", fontSize: 16, fontWeight: 500 }} />
        </div>
        {headerTitle ? <div className="nav-label">{headerTitle}</div> : null}
        <PortalRailNav sections={translated} />
        <div className="mt-auto flex justify-end pt-3">
          <LocaleSwitcher />
        </div>
      </aside>
    </>
  );
}
