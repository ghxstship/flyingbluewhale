"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";

/**
 * Marketing header — consolidated to the SaaS-standard five-nav pattern
 * (Linear, Vercel, Stripe, ClickUp, Notion all land here in 2026): three
 * grouped dropdowns + two direct links + a primary CTA.
 *
 * Utility controls (theme palette, locale, light/dark mode) moved to the
 * marketing footer — no public SaaS marketing nav in the reference set
 * keeps them up top. They reappear in /me/settings/appearance for
 * authenticated users.
 */

type NavLink = { label: string; href: string; description?: string };
type NavGroup = { label: string; items: NavLink[] };

const PRODUCT: NavGroup = {
  label: "Product",
  items: [
    { label: "Features", href: "/features", description: "Everything in ATLVS, GVTEWAY, and COMPVSS" },
    { label: "Solutions", href: "/solutions", description: "Three connected apps, one platform" },
    { label: "Compare", href: "/compare", description: "vs. Asana, Monday, spreadsheets" },
  ],
};

const INDUSTRIES: NavGroup = {
  label: "Industries",
  items: [
    { label: "Live events", href: "/solutions/live-events" },
    { label: "Concerts", href: "/solutions/concerts" },
    { label: "Festivals & tours", href: "/solutions/festivals-tours" },
    { label: "Immersive experiences", href: "/solutions/immersive-experiences" },
    { label: "Brand activations", href: "/solutions/brand-activations" },
    { label: "Corporate events", href: "/solutions/corporate-events" },
    { label: "Theatrical performances", href: "/solutions/theatrical-performances" },
    { label: "Broadcast, TV & film", href: "/solutions/broadcast-tv-film" },
  ],
};

const RESOURCES: NavGroup = {
  label: "Resources",
  items: [
    { label: "Blog", href: "/blog", description: "Launches, product notes, industry takes" },
    { label: "Guides", href: "/guides", description: "Long-form primers for producers" },
    { label: "Docs", href: "/docs", description: "Reference + API" },
    { label: "Changelog", href: "/changelog", description: "Every release, dated" },
  ],
};

function NavDropdown({ group }: { group: NavGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="nav-item inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--org-primary)]"
        >
          {group.label}
          <ChevronDown size={12} aria-hidden="true" className="text-[var(--text-muted)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 p-2"
        style={{ background: "var(--background)" }}
      >
        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer p-2">
            <Link href={item.href} className="flex w-full flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-[var(--foreground)]">{item.label}</span>
              {item.description && (
                <span className="text-xs text-[var(--text-muted)]">{item.description}</span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

        {/* Desktop primary nav — 3 dropdowns + 2 direct links = 5 visible items,
            matching Linear / Vercel / Stripe / ClickUp / Notion convention. */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <NavDropdown group={PRODUCT} />
          <NavDropdown group={INDUSTRIES} />
          <Link href="/pricing" className="nav-item">Pricing</Link>
          <Link href="/community" className="nav-item">Community</Link>
          <NavDropdown group={RESOURCES} />
        </nav>

        {/* Desktop right cluster — Log in (secondary text link) + Start Free (primary CTA) */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)]"
          >
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Start free
          </Link>
        </div>

        {/* Mobile trigger */}
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

      {/* Mobile sheet */}
      {mobileOpen && (
        <div
          id="mobile-nav-sheet"
          className="lg:hidden border-t border-[var(--border-color)] bg-[var(--background)]"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5">
            <MobileNavSection group={PRODUCT} onClick={() => setMobileOpen(false)} />
            <MobileNavSection group={INDUSTRIES} onClick={() => setMobileOpen(false)} />
            <nav className="flex flex-col gap-1" aria-label="Mobile primary">
              <Link
                href="/pricing"
                className="nav-item text-base"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/community"
                className="nav-item text-base"
                onClick={() => setMobileOpen(false)}
              >
                Community
              </Link>
            </nav>
            <MobileNavSection group={RESOURCES} onClick={() => setMobileOpen(false)} />
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
                Start free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNavSection({ group, onClick }: { group: NavGroup; onClick: () => void }) {
  return (
    <details className="group" open>
      <summary className="nav-item cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] list-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between">
          {group.label}
          <ChevronDown size={12} className="transition group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <nav className="ms-2 mt-1 flex flex-col gap-0.5" aria-label={group.label}>
        {group.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-item text-base"
            onClick={onClick}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
