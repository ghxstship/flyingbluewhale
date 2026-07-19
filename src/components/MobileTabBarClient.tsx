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
  Sparkles,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
import { navItemKey } from "@/lib/i18n/nav-label";

const ICONS: Record<string, typeof Home> = {
  // COMPVSS kit tab model — the kit's TABS array (kit 33 v3.0,
  // design_handoff_compvss_field/runtime/app.jsx:938): Home · Calendar ·
  // Tasks · Inbox · Aurora · More (6 tabs). Icons are the kit's too: Home is
  // Palmtree, Aurora is Sparkles, and More is MoreVertical.
  "/m": Palmtree,
  "/m/schedule": CalendarDays,
  "/m/tasks": ListChecks,
  "/m/inbox": MessageSquare,
  "/m/aurora": Sparkles,
  "/m/more": MoreVertical,
  "/m/assets": Package,
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
 * Parent-tab ownership — kit 33 v3.0 (runtime/app.jsx `TABS` + `NAV_GROUPS`):
 * sub-screens light their parent tab. Home owns the emergency pages, the time
 * clock, and the assign flow; **More** owns every nav-drawer hub surface it
 * links (including Assets + the advance cart, which moved out of the retired
 * Assets tab, and the new Operations ledgers). Aurora is a leaf — it owns no
 * sub-surface. Routes NOT listed (profile, notifications, search) light no tab.
 */
const PARENT_PREFIXES: Record<string, string[]> = {
  "/m": ["/m/emergency", "/m/clock", "/m/assign"],
  "/m/more": [
    // My Work
    "/m/assets",
    "/m/advance",
    "/m/advances",
    "/m/time",
    "/m/documents",
    "/m/activity",
    "/m/time-off",
    // Workplace
    "/m/feed",
    "/m/spaces",
    "/m/docs",
    "/m/guide",
    "/m/engagement",
    // Field Operations — hubs (kit 34) + their members
    "/m/projects",
    "/m/operations",
    "/m/workforce",
    "/m/equipment",
    "/m/reports",
    "/m/inspections",
    "/m/inventory",
    "/m/logistics",
    "/m/catalog",
    "/m/expenses",
    "/m/permits",
    "/m/travel",
    "/m/templates",
    "/m/finance",
    "/m/scheduler",
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
    // People & Teams
    "/m/directory",
    "/m/companies",
    "/m/connections",
    "/m/onboarding",
    "/m/roster",
    // Opportunities
    "/m/jobs",
    "/m/market",
    "/m/referrals",
    // Manage / account
    "/m/my-work",
    "/m/timesheets",
    "/m/mileage",
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
        const inner = (
          <>
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
          </>
        );
        // Kit 33 v3.0: the More tab opens the left nav drawer (a sibling client
        // island, `MobileNavDrawer`, listening for `compvss:nav-open`) instead
        // of routing. Every other tab — including Aurora — is a normal Link.
        if (i.href === "/m/more") {
          return (
            <button
              key={i.href}
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("compvss:nav-open"))}
              aria-current={active ? "page" : undefined}
              aria-haspopup="menu"
              className={`tb${active ? " on" : ""}`}
              style={{ textDecoration: "none", background: "none" }}
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`tb${active ? " on" : ""}`}
            style={{ textDecoration: "none" }}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
