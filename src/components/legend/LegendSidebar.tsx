"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/lib/nav";
import { NAV_ICONS } from "@/components/nav-icons";
import { matchRoute } from "@/lib/hooks/useActiveRoute";

/**
 * LEG3ND shell sidebar — grouped, scalable nav matching the LMS reference app's
 * IA (LEARN · COMMUNITY · COMPETE · MANAGE · KNOWLEDGE · ACCOUNT). Distinct from
 * the console `PlatformSidebar` (no workspace switcher / pin / resize chrome) —
 * LEG3ND is its own product surface with its own identity.
 *
 * Desktop: fixed left rail. Mobile (< md): a horizontally scrollable item row so
 * the full surface set stays reachable without a drawer.
 */
export function LegendSidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname() ?? "";
  const allItems = groups.flatMap((g) => g.items);

  return (
    <>
      {/* Desktop rail */}
      <aside
        aria-label="LEG3ND"
        className="hidden w-56 shrink-0 border-e border-[var(--p-border)] bg-[var(--p-surface)] md:block"
      >
        <nav className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          {groups.map((g) => (
            <div key={g.label} className="mb-4">
              <div className="px-2 pb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--p-text-3)]">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((item) => {
                  const active = matchRoute(pathname, item.href).isActive;
                  const Icon = item.icon ? NAV_ICONS[item.icon] : null;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={false}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                          active
                            ? "bg-[var(--p-surface-2)] font-medium text-[var(--p-text-1)]"
                            : "text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
                        }`}
                      >
                        {active && (
                          <span aria-hidden className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-[var(--p-accent)]" />
                        )}
                        {Icon ? <Icon size={16} strokeWidth={2} className="shrink-0" aria-hidden /> : null}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile scroller */}
      <nav
        aria-label="LEG3ND"
        className="sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 md:hidden"
      >
        {allItems.map((item) => {
          const active = matchRoute(pathname, item.href).isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-[var(--p-accent)] text-[var(--p-accent-cta-contrast)]"
                  : "bg-[var(--p-surface-2)] text-[var(--p-text-2)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
