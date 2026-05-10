"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { matchRoute } from "@/lib/match-route";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";

export function PortalRailClient({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--org-primary)]">
        GVTEWAY
      </div>
      <div className="nav-label">{title}</div>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((i) => {
          const { isActive: active } = matchRoute(pathname ?? "", i.href);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={active ? "nav-item nav-item-active" : "nav-item"}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto flex justify-end pt-3">
        <LocaleSwitcher />
      </div>
    </aside>
  );
}
