"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Palmtree,
  MoreVertical,
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
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { navItemKey } from "@/lib/i18n/nav-label";

const ICONS: Record<string, typeof Home> = {
  // COMPVSS kit tab model — the kit's TABS array verbatim (kit 28,
  // design_handoff_compvss_field/runtime/app.jsx:796): Home · Calendar ·
  // Tasks · Inbox · Assets · More (6 tabs). Icons are the kit's too: Home is
  // Palmtree, not Home, and More is MoreVertical, not MoreHorizontal.
  "/m": Palmtree,
  "/m/schedule": CalendarDays,
  "/m/tasks": ListChecks,
  "/m/inbox": MessageSquare,
  "/m/assets": Package,
  "/m/more": MoreVertical,
  "/m/inventory": Package,
  // Secondary surfaces — reachable from /m/more and cmd-K (icons used when a
  // surface appears in a bar/list that resolves through this map).
  "/m/settings": User,
  "/m/check-in": QrCode,
  "/m/guide": BookOpen,
  "/m/clock": Clock,
  "/m/notifications": Bell,
  "/m/incidents": Siren,
  "/m/incident": Siren,
  "/m/pass": ShieldCheck,
};

/**
 * Parent-tab ownership — kit 31 (runtime/app.jsx:4643): sub-screens light
 * their parent tab. Home owns the emergency pages, the time clock, and the
 * assign flow; Assets owns the advance cart; More owns every hub surface it
 * links. Routes NOT listed (profile, notifications, search) light no tab —
 * the kit's active map is the fixture, extended only with repo route
 * spellings for the same surfaces.
 */
const PARENT_PREFIXES: Record<string, string[]> = {
  "/m": ["/m/emergency", "/m/clock", "/m/assign"],
  "/m/assets": ["/m/advance", "/m/advances"],
  "/m/more": [
    // Operations
    "/m/catalog",
    "/m/inventory",
    "/m/documents",
    "/m/templates",
    "/m/finance",
    "/m/requests",
    "/m/requisitions",
    "/m/coc",
    "/m/handover",
    "/m/daily-log",
    "/m/punch",
    "/m/check-in",
    "/m/scan",
    "/m/door",
    "/m/incidents",
    "/m/incident",
    "/m/lost-found",
    // Time & Work
    "/m/my-work",
    "/m/time",
    "/m/timesheets",
    "/m/time-off",
    "/m/expenses",
    "/m/mileage",
    "/m/activity",
    // Workplace
    "/m/feed",
    "/m/spaces",
    "/m/docs",
    "/m/guide",
    "/m/engagement",
    // People
    "/m/directory",
    "/m/companies",
    "/m/connections",
    "/m/onboarding",
    // Opportunities
    "/m/jobs",
    "/m/market",
    "/m/referrals",
    // Account
    "/m/pass",
    "/m/settings",
    "/m/support",
  ],
};

export function MobileTabBarClient({ items, badges }: { items: NavItem[]; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const t = useT();

  // Mirror the total unread/open count onto the installed-app icon via the
  // App Badging API (Chromium PWAs; silently unsupported elsewhere).
  const totalBadge = Object.values(badges ?? {}).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);
  React.useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof nav.setAppBadge !== "function") return;
    if (totalBadge > 0) void nav.setAppBadge(totalBadge).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  }, [totalBadge]);

  // Root tabs match exactly only — the shell root (/m) is a prefix of every
  // sibling tab's href, so a startsWith match would light Home on every route.
  const isRootHref = (href: string) =>
    href === "/m" || items.some((other) => other.href !== href && other.href.startsWith(`${href}/`));

  const ownsPath = (href: string) =>
    (PARENT_PREFIXES[href] ?? []).some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  return (
    <nav
      role="navigation"
      aria-label={t("marketing.header.primaryAriaLabel", undefined, "Primary")}
      // Kit 31 `.tabbar` — floating (inset 12/16px, radius 20, elevated);
      // geometry lives in kit-mobile.css, not here.
      className="tabbar"
    >
      {items.map((i) => {
        const direct = isRootHref(i.href)
          ? pathname === i.href
          : pathname === i.href || pathname?.startsWith(`${i.href}/`);
        const active = direct || ownsPath(i.href);
        const Icon = ICONS[i.href] ?? Home;
        const badgeCount = badges?.[i.href] ?? 0;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`tb${active ? " on" : ""}`}
            style={{ textDecoration: "none" }}
          >
            <span className="relative">
              <Icon size={21} aria-hidden="true" />
              {badgeCount > 0 && (
                <span className="absolute -end-2 -top-1.5">
                  <Badge variant="error" shape="count" aria-label={`${badgeCount} unread`}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                </span>
              )}
            </span>
            <span>{t(navItemKey(i), undefined, i.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
