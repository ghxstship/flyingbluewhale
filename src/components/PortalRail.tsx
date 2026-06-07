import Link from "next/link";
import type { NavGroup, NavItem, NavSection } from "@/lib/nav";
import { matchRoute } from "@/lib/match-route";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { getRequestT } from "@/lib/i18n/request";
import { navGroupKey, navItemKey } from "@/lib/i18n/nav-label";

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
 */
export async function PortalRail({
  group,
  items,
  title,
  currentPath,
}: {
  group?: NavGroup;
  items?: NavItem[];
  title?: string;
  currentPath?: string;
}) {
  const { t } = await getRequestT();
  const sections: NavSection[] = group?.sections?.length
    ? group.sections
    : group
      ? [{ label: group.label, items: group.items }]
      : [{ label: title ?? "", items: items ?? [] }];
  const headerTitle = title ?? (group ? t(navGroupKey(group), undefined, group.label) : "");
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-e border-[var(--p-border)] bg-[var(--p-surface)] p-3 md:flex">
      {/* Canonical SaaS brand row — cyan-tiled Waypoint app-icon + spaced
          wordmark per ui_kits/atlvs/dashboard.html .brandrow. Per v4
          logo-kit canon, the GVTEWAY app icon is the Waypoint on cyan. */}
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
        <span className="text-base font-bold tracking-[-0.01em] text-[var(--p-accent)]">G V T E W A Y</span>
      </div>
      {headerTitle ? <div className="nav-label">{headerTitle}</div> : null}
      {sections.map((section, idx) => {
        const sectionLabel = section.label ? t(navGroupKey(section), undefined, section.label) : "";
        return (
          <div key={`${section.label}-${idx}`} className={idx === 0 ? "mt-0.5" : "mt-3"}>
            {idx > 0 && sectionLabel ? (
              <div className="nav-label px-2 pb-1 text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
                {sectionLabel}
              </div>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((i) => {
                const { isActive: active } = matchRoute(currentPath ?? "", i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={active ? "page" : undefined}
                      className={active ? "nav-item nav-item-active" : "nav-item"}
                    >
                      {t(navItemKey(i), undefined, i.label)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <div className="mt-auto flex justify-end pt-3">
        <LocaleSwitcher />
      </div>
    </aside>
  );
}
