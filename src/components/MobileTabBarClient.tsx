"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clock,
  Bell,
  User,
  QrCode,
  BookOpen,
  Siren,
  ShieldCheck,
  CalendarDays,
  ListChecks,
  Package,
  MessageSquare,
  Menu,
  Radio,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { navItemKey } from "@/lib/i18n/nav-label";

const ICONS: Record<string, typeof Home> = {
  // COMPVSS kit tab model (rebuild 2026-06-21): Home · Calendar · Tasks ·
  // Assets · Inbox · More.
  "/m": Home,
  "/m/schedule": CalendarDays,
  "/m/tasks": ListChecks,
  "/m/onsite": Radio,
  "/m/inventory": Package,
  "/m/inbox": MessageSquare,
  "/m/more": Menu,
  // Secondary surfaces — reachable from /m/more and cmd-K (icons used when a
  // surface appears in a bar/list that resolves through this map).
  "/m/settings": User,
  "/m/check-in": QrCode,
  "/m/guide": BookOpen,
  "/m/clock": Clock,
  "/m/alerts": Bell,
  "/m/notifications": Bell,
  "/m/incidents": Siren,
  "/m/incident": Siren,
  "/m/wallet": ShieldCheck,
};

export function MobileTabBarClient({ items, badges }: { items: NavItem[]; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const t = useT();

  // Root tabs match exactly only — the shell root (/m) and role homes
  // (/m/medic, /m/crew, …) are prefixes of every sibling tab's href, so
  // a startsWith match would light Home on every route.
  const isRootHref = (href: string) =>
    href === "/m" || items.some((other) => other.href !== href && other.href.startsWith(`${href}/`));

  return (
    <nav
      role="navigation"
      aria-label={t("marketing.header.primaryAriaLabel", undefined, "Primary")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--p-border)] bg-[var(--p-bg)]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((i) => {
          const active = isRootHref(i.href)
            ? pathname === i.href
            : pathname === i.href || pathname?.startsWith(`${i.href}/`);
          const Icon = ICONS[i.href] ?? Home;
          const badgeCount = badges?.[i.href] ?? 0;
          return (
            <li key={i.href} className="relative">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 text-[0.62rem] font-medium tracking-wide uppercase transition-colors"
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-0.5 rounded-b-full bg-[var(--p-accent)]"
                  />
                )}
                <span className="relative">
                  <Icon
                    size={18}
                    className={active ? "text-[var(--p-accent)]" : "text-[var(--p-text-2)]"}
                    aria-hidden="true"
                  />
                  {badgeCount > 0 && (
                    <span className="absolute -end-2 -top-1.5">
                      <Badge variant="error" shape="count" aria-label={`${badgeCount} unread`}>
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </Badge>
                    </span>
                  )}
                </span>
                <span className={active ? "text-[var(--p-accent)]" : "text-[var(--p-text-2)]"}>
                  {t(navItemKey(i), undefined, i.label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
