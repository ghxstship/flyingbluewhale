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
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";

/**
 * Marketing header — three grouped dropdowns + two direct links + a
 * primary CTA, plus a utility cluster (locale / light-dark) on the
 * right. The legacy 8-theme design picker was retired with the v3
 * ATLVS-kit lock — the platform now ships a two-skin canon (cosmic
 * GHXSTSHIP for /ghxstship, ATLVS product for everything else) and the
 * mode toggle is the only visible appearance affordance.
 */

type NavLink = { label: string; href: string; description?: string };
type NavGroup = { label: string; items: NavLink[] };

const PRODUCT: NavGroup = {
  label: "Product",
  items: [
    { label: "Features", href: "/features", description: "Every module, every phase" },
    { label: "Solutions", href: "/solutions", description: "ATLVS · COMPVSS · GVTEWAY" },
    { label: "ATLVS — Production", href: "/solutions/atlvs", description: "Producer console" },
    { label: "COMPVSS — Crew", href: "/solutions/compvss", description: "Workforce + field ops" },
    { label: "GVTEWAY — Guests", href: "/solutions/gvteway", description: "Ticketing + stakeholder portal" },
  ],
};

const INDUSTRIES: NavGroup = {
  label: "Industries",
  items: [
    { label: "Live Events", href: "/solutions/live-events" },
    { label: "Concerts", href: "/solutions/concerts" },
    { label: "Festivals & tours", href: "/solutions/festivals-tours" },
    { label: "Immersive Experiences", href: "/solutions/immersive-experiences" },
    { label: "Brand Activations", href: "/solutions/brand-activations" },
    { label: "Corporate Events", href: "/solutions/corporate-events" },
    { label: "Theatrical Performances", href: "/solutions/theatrical-performances" },
    { label: "Broadcast, TV & film", href: "/solutions/broadcast-tv-film" },
  ],
};

const RESOURCES: NavGroup = {
  label: "Resources",
  items: [
    { label: "Blog", href: "/blog", description: "Launches, releases, industry takes" },
    { label: "Guides", href: "/guides", description: "Long-form for producers" },
    { label: "Docs", href: "/docs", description: "Platform reference + API" },
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
      <DropdownMenuContent align="start" className="w-64 p-2" style={{ background: "var(--background)" }}>
        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer p-2">
            <Link href={item.href} className="flex w-full flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-[var(--foreground)]">{item.label}</span>
              {item.description && <span className="text-xs text-[var(--text-muted)]">{item.description}</span>}
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
    <header className="sticky top-0 z-40 border-b border-[var(--p-border)] bg-[var(--p-surface)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
        <Link
          href="/"
          // whitespace-nowrap: the spaced "A T L V S" mark uses literal
          // U+0020 between letters so screen readers + selection treat each
          // letter as a separate word. Without nowrap, narrow viewports
          // (~1024px tablet) wrap the mark letter-by-letter into a vertical
          // stack instead of keeping it horizontal.
          //
          // Inter at weight 800 + tight tracking is the ATLVS product canon
          // lockup — the SaaS skin doesn't use Big Shoulders even for the
          // wordmark. Brand display is reserved for the cosmic surface only.
          className="text-[1.3rem] leading-none font-extrabold tracking-[0.04em] whitespace-nowrap text-[var(--p-text-1)] uppercase"
          onClick={() => setMobileOpen(false)}
          aria-label="ATLVS Technologies — home"
        >
          A T L V S
        </Link>

        {/* Desktop primary nav — 3 dropdowns + 2 direct links = 5 visible items,
            matching Linear / Vercel / Stripe / ClickUp / Notion convention. */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          <NavDropdown group={PRODUCT} />
          <NavDropdown group={INDUSTRIES} />
          <Link href="/marketplace" className="nav-item">
            Marketplace
          </Link>
          <Link href="/pricing" className="nav-item">
            Pricing
          </Link>
          <Link href="/community" className="nav-item">
            Community
          </Link>
          <NavDropdown group={RESOURCES} />
        </nav>

        {/* Desktop right cluster — utility icons (locale / mode) +
            Log In (secondary text link) + Start free (primary CTA). */}
        <div className="hidden items-center gap-2 xl:flex">
          <LocaleSwitcher />
          <ThemeToggle />
          <div aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--border-color)]" />
          <Link
            href="/login"
            className="text-sm font-medium whitespace-nowrap text-[var(--text-secondary)] hover:text-[var(--foreground)]"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[var(--p-accent)] px-4 py-2 text-sm font-semibold text-[var(--p-accent-contrast)] transition hover:brightness-95"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-sheet"
          className="btn btn-ghost btn-sm xl:hidden"
        >
          {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div id="mobile-nav-sheet" className="border-t border-[var(--border-color)] bg-[var(--background)] xl:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5">
            <MobileNavSection group={PRODUCT} onClick={() => setMobileOpen(false)} />
            <MobileNavSection group={INDUSTRIES} onClick={() => setMobileOpen(false)} />
            <nav className="flex flex-col gap-1" aria-label="Mobile primary">
              <Link href="/marketplace" className="nav-item text-base" onClick={() => setMobileOpen(false)}>
                Marketplace
              </Link>
              <Link href="/pricing" className="nav-item text-base" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              <Link href="/community" className="nav-item text-base" onClick={() => setMobileOpen(false)}>
                Community
              </Link>
            </nav>
            <MobileNavSection group={RESOURCES} onClick={() => setMobileOpen(false)} />
            <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">Theme</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">Language</span>
                <LocaleSwitcher />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
              <Link
                href="/login"
                className="btn btn-ghost btn-sm w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="w-full justify-center rounded-md bg-[var(--p-accent)] px-4 py-2 text-center text-sm font-semibold text-[var(--p-accent-contrast)] transition hover:brightness-95"
                onClick={() => setMobileOpen(false)}
              >
                Start Free
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
      <summary className="nav-item cursor-pointer list-none text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between">
          {group.label}
          <ChevronDown size={12} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <nav className="ms-2 mt-1 flex flex-col gap-0.5" aria-label={group.label}>
        {group.items.map((item) => (
          <Link key={item.href} href={item.href} className="nav-item text-base" onClick={onClick}>
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
