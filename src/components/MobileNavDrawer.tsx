"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { NAV_ICONS } from "@/components/nav-icons";
import type { NavGroup, NavItem, NavSection } from "@/lib/nav";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Mobile-only platform nav. The desktop PlatformSidebar is hidden at
 * `< md` (768px) because its 200–400px width swallows the entire mobile
 * viewport (375px common phone, leaves 135px for content — sub-readable).
 *
 * This component replaces it on narrow viewports with a hamburger
 * trigger in the top bar that opens an off-canvas drawer. The drawer
 * renders the same `platformNav` data the desktop sidebar does, but in
 * a flattened single-column always-expanded form because tap-to-collapse
 * groups inside a drawer is one extra tap per destination — punishing on
 * mobile.
 *
 * Per CLAUDE.md: every paint resolves from token vars; primitives use
 * the legacy --org-* alias contract so the per-product accent (ATLVS
 * pink / COMPVSS amber / GVTEWAY cyan) shows through automatically.
 */
export function MobileNavDrawer({ groups }: { groups: NavGroup[] }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Auto-close on route change so each tap-to-navigate dismisses the drawer.
  // Without this, the drawer stays open over the destination page.
  const lastPathRef = React.useRef(pathname);
  React.useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("shell.nav.openNavigation", undefined, "Open navigation")}
          className="-ms-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)] md:hidden"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        // The Sheet renders inside a Radix Portal mounted on <body>,
        // which means the descendant CSS-var cascade from the
        // `<div data-theme="atlvs-product">` shell doesn't reach it.
        // Re-anchor the SaaS skin here so the drawer paints neutral
        // SaaS surfaces + the per-product accent instead of inheriting
        // the cosmic ghxstship root.
        data-theme="atlvs-product"
        data-platform="atlvs"
        className="w-[85vw] max-w-[320px] overflow-y-auto bg-[var(--p-surface,var(--p-surface))] p-0 text-[var(--p-text-1,var(--p-text-1))]"
      >
        <div className="flex items-center justify-between border-b border-[var(--p-border,var(--p-border))] px-4 py-3">
          {/* Kit v3 brand header — accent-tile + waypoint mark + name,
              mirroring ui_kits/atlvs/dashboard.html .brandrow. The
              Waypoint star (atlvs-mark-white.svg) replaces the ghost-
              ship skull on every product surface; the skull is parent-
              company GHXSTSHIP only. */}
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className="grid h-7 w-7 flex-none place-items-center rounded-[7px] bg-[var(--p-accent,var(--p-accent))]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/atlvs-mark-white.svg" alt="" width={18} height={18} />
            </span>
            <div className="text-base font-bold tracking-[-0.01em] text-[var(--p-text-1,var(--p-text-1))]">ATLVS</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("shell.nav.closeNavigation", undefined, "Close navigation")}
            className="rounded p-1 text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <nav className="space-y-4 px-2 py-3" aria-label="Mobile primary">
          {groups.map((group) => (
            <NavGroupBlock key={group.label} group={group} pathname={pathname} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function NavGroupBlock({ group, pathname }: { group: NavGroup; pathname: string }) {
  const items = group.sections ? group.sections.flatMap((s: NavSection) => s.items) : (group.items ?? []);
  if (!items.length) return null;
  return (
    <div>
      <div className="px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--p-text-2)] uppercase">
        {group.label}
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <NavRow item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm transition ${
        active
          ? "bg-[var(--p-surface-2,var(--p-surface-2))] font-semibold text-[var(--p-accent,var(--p-accent))]"
          : "text-[var(--p-text-1,var(--p-text-1))] hover:bg-[var(--p-surface-2,var(--p-surface-2))]"
      }`}
    >
      {Icon ? <Icon size={16} aria-hidden="true" className="shrink-0" /> : <span className="w-4" aria-hidden="true" />}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
