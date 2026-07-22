"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PersonalTabGroup = {
  label: string;
  tabs: Array<{ label: string; href: string }>;
};

/**
 * The /me horizontal tab strip (ADR-0010 three-area grouping), lifted into a
 * client island so the active route can be computed from the pathname —
 * previously the tabs never marked the current page (AUDIT C-27).
 *
 * Active resolution: longest matching href wins, where a match is an exact
 * pathname or a path-segment prefix (`/me/notifications/inbox` highlights
 * Notifications without `/me` swallowing every route).
 */
export function PersonalTabs({ groups }: { groups: PersonalTabGroup[] }) {
  const pathname = usePathname() ?? "";
  const active = groups
    .flatMap((g) => g.tabs.map((t) => t.href))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--p-border)] pb-2">
      {groups.map((group, i) => (
        <div key={group.label} className="flex flex-wrap items-center gap-1">
          {i > 0 ? (
            <span aria-hidden="true" className="text-[var(--p-text-2)]">
              ·
            </span>
          ) : null}
          <span className="eyebrow me-0.5">
            {group.label}
          </span>
          {group.tabs.map((tab) => {
            const isActive = tab.href === active;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`nav-item text-sm${isActive ? " nav-item-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
