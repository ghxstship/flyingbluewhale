"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, QrCode, BookOpen, CheckSquare, User } from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { Badge } from "@/components/ui/Badge";

const ICONS: Record<string, typeof Home> = {
  "/m": Home,
  "/m/check-in": QrCode,
  "/m/guide": BookOpen,
  "/m/tasks": CheckSquare,
  "/m/settings": User,
};

export function MobileTabBarClient({
  items,
  badges,
}: {
  items: NavItem[];
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = pathname === i.href || pathname?.startsWith(`${i.href}/`);
          const Icon = ICONS[i.href] ?? Home;
          const badgeCount = badges?.[i.href] ?? 0;
          return (
            <li key={i.href} className="relative">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 text-[0.62rem] font-medium uppercase tracking-wide transition-colors"
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-[var(--org-primary)]"
                  />
                )}
                <span className="relative">
                  <Icon
                    size={18}
                    className={active ? "text-[var(--org-primary)]" : "text-[var(--text-muted)]"}
                    aria-hidden="true"
                  />
                  {badgeCount > 0 && (
                    <span className="absolute -right-2 -top-1.5">
                      <Badge variant="error" shape="count" aria-label={`${badgeCount} unread`}>
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </Badge>
                    </span>
                  )}
                </span>
                <span className={active ? "text-[var(--org-primary)]" : "text-[var(--text-muted)]"}>
                  {i.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
