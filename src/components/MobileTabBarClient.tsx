"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  Clock,
  Bell,
  User,
  QrCode,
  BookOpen,
  CheckSquare,
  Calendar,
  Map,
  ClipboardList,
  Siren,
  ShieldCheck,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { navItemKey } from "@/lib/i18n/nav-label";

const ICONS: Record<string, typeof Home> = {
  // ADR-0006 generic-default tab bar.
  "/m": Home,
  "/m/inbox": Inbox,
  "/m/shift": Clock,
  "/m/alerts": Bell,
  "/m/settings": User,
  // Retained mappings so legacy tab bar configs (and persona-routed
  // variants from ADR-0009) render correctly.
  "/m/check-in": QrCode,
  "/m/guide": BookOpen,
  "/m/tasks": CheckSquare,
  // ADR-0009 per-role tab bar destinations. Role home routes
  // (/m/performer, /m/crew, /m/admin) map to Home; specialist roles
  // that have static surfaces (/m/driver, /m/medic, /m/guard) reuse
  // existing icons for their primary verbs.
  "/m/performer": Home,
  "/m/crew": Home,
  "/m/admin": Home,
  "/m/driver": Map,
  "/m/medic": ClipboardList,
  "/m/medic/new": ClipboardList,
  "/m/ad": Map,
  "/m/guard": ShieldCheck,
  "/m/gate": QrCode,
  "/m/incidents": Siren,
  "/m/incident": Siren,
  "/m/wayfind": Map,
  // Schedule lives on /m/shift for the existing surface — but the
  // performer tab bar labels it "Schedule"; the same href works.
  "/m/schedule": Calendar,
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
      <ul className="grid grid-cols-5">
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
