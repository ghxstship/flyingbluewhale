"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Palette } from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { ThemeGallerySheet } from "@/components/marketing/ThemeGallerySheet";

/**
 * Marketing-specific header chrome.
 *
 * Client component because it hosts:
 *   - open state for the mobile nav sheet
 *   - open state for the CHROMA BEACON theme picker sheet
 *   - the locale switcher which calls `router.refresh()` after the cookie
 *
 * All navigation links, theme toggle, and locale switcher live here — the
 * mobile sheet re-renders the same set so there's a single source of truth
 * for what a visitor can reach.
 */
export function MarketingHeader() {
  const items: NavItem[] = [
    { label: "Solutions", href: "/solutions" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Customers", href: "/customers" },
    { label: "Compare", href: "/compare" },
    { label: "Guides", href: "/guides" },
    { label: "Blog", href: "/blog" },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="text-base font-semibold tracking-[0.14em] uppercase text-[var(--foreground)]"
          onClick={() => setMobileOpen(false)}
          aria-label="Second Star Technologies — home"
        >
          SECOND STVR
        </Link>

        {/* Desktop primary nav — gated at `lg` because 7 items + a 5-control
            right-cluster does not fit under 1024 without overflow. */}
        <nav className="hidden gap-1 lg:flex" aria-label="Primary">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="nav-item">
              {i.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right-hand cluster */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => setThemePickerOpen(true)}
            className="btn btn-ghost btn-sm inline-flex items-center gap-1.5"
            aria-label="Open design-system theme picker"
          >
            <Palette size={14} aria-hidden="true" />
            <span className="hidden xl:inline">Themes</span>
          </button>
          <LocaleSwitcher />
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Sign up</Link>
        </div>

        {/* Mobile / tablet trigger — shown below `lg` since the desktop nav
            collapses into the sheet at that breakpoint. */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-sheet"
          className="btn btn-ghost btn-sm lg:hidden"
        >
          {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile sheet — full-height, above-the-fold, single source for all controls */}
      {mobileOpen && (
        <div
          id="mobile-nav-sheet"
          className="lg:hidden border-t border-[var(--border-color)] bg-[var(--background)]"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5">
            <nav className="flex flex-col gap-1" aria-label="Mobile primary">
              {items.map((i) => (
                <Link
                  key={i.href}
                  href={i.href}
                  className="nav-item text-base"
                  onClick={() => setMobileOpen(false)}
                >
                  {i.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Theme
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Language
                </span>
                <LocaleSwitcher />
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setThemePickerOpen(true);
                }}
                className="btn btn-ghost btn-sm inline-flex items-center gap-2 justify-center"
              >
                <Palette size={14} aria-hidden="true" />
                Design themes
              </button>
            </div>
            <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
              <Link
                href="/login"
                className="btn btn-ghost btn-sm w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn btn-primary btn-sm w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}

      <ThemeGallerySheet open={themePickerOpen} onOpenChange={setThemePickerOpen} />
    </header>
  );
}
