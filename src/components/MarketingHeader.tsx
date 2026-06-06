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
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Marketing header — three grouped dropdowns + two direct links + a
 * primary CTA, plus a utility cluster (locale / light-dark) on the
 * right. The legacy 8-theme design picker was retired with the v3
 * ATLVS-kit lock — the platform now ships a two-skin canon (cosmic
 * GHXSTSHIP for /ghxstship, ATLVS product for everything else) and the
 * mode toggle is the only visible appearance affordance.
 */

// Static data carries i18n keys (`labelKey`, `descriptionKey`) instead of
// raw strings. `t()` resolves them at render with the English catalog as
// fallback, so untranslated locales degrade to English rather than dot-paths.
type NavLink = { labelKey: string; href: string; descriptionKey?: string };
type NavGroup = { labelKey: string; items: NavLink[] };

const PRODUCT: NavGroup = {
  labelKey: "marketing.header.product.label",
  items: [
    {
      labelKey: "marketing.header.product.features.label",
      href: "/features",
      descriptionKey: "marketing.header.product.features.description",
    },
    {
      labelKey: "marketing.header.product.solutions.label",
      href: "/solutions",
      descriptionKey: "marketing.header.product.solutions.description",
    },
    {
      labelKey: "marketing.header.product.atlvs.label",
      href: "/solutions/atlvs",
      descriptionKey: "marketing.header.product.atlvs.description",
    },
    {
      labelKey: "marketing.header.product.compvss.label",
      href: "/solutions/compvss",
      descriptionKey: "marketing.header.product.compvss.description",
    },
    {
      labelKey: "marketing.header.product.gvteway.label",
      href: "/solutions/gvteway",
      descriptionKey: "marketing.header.product.gvteway.description",
    },
  ],
};

const INDUSTRIES: NavGroup = {
  labelKey: "marketing.header.industries.label",
  items: [
    { labelKey: "marketing.industries.live-events", href: "/solutions/live-events" },
    { labelKey: "marketing.industries.concerts", href: "/solutions/concerts" },
    { labelKey: "marketing.industries.festivals-tours", href: "/solutions/festivals-tours" },
    { labelKey: "marketing.industries.immersive-experiences", href: "/solutions/immersive-experiences" },
    { labelKey: "marketing.industries.brand-activations", href: "/solutions/brand-activations" },
    { labelKey: "marketing.industries.corporate-events", href: "/solutions/corporate-events" },
    { labelKey: "marketing.industries.theatrical-performances", href: "/solutions/theatrical-performances" },
    { labelKey: "marketing.industries.broadcast-tv-film", href: "/solutions/broadcast-tv-film" },
  ],
};

const RESOURCES: NavGroup = {
  labelKey: "marketing.header.resources.label",
  items: [
    {
      labelKey: "marketing.header.resources.blog.label",
      href: "/blog",
      descriptionKey: "marketing.header.resources.blog.description",
    },
    {
      labelKey: "marketing.header.resources.guides.label",
      href: "/guides",
      descriptionKey: "marketing.header.resources.guides.description",
    },
    {
      labelKey: "marketing.header.resources.docs.label",
      href: "/docs",
      descriptionKey: "marketing.header.resources.docs.description",
    },
    {
      labelKey: "marketing.header.resources.changelog.label",
      href: "/changelog",
      descriptionKey: "marketing.header.resources.changelog.description",
    },
  ],
};

function NavDropdown({ group }: { group: NavGroup }) {
  const t = useT();
  const groupLabel = t(group.labelKey);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="nav-item inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--org-primary)]"
        >
          {groupLabel}
          <ChevronDown size={12} aria-hidden="true" className="text-[var(--text-muted)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2" style={{ background: "var(--background)" }}>
        <DropdownMenuLabel>{groupLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer p-2">
            <Link href={item.href} className="flex w-full flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-[var(--foreground)]">{t(item.labelKey)}</span>
              {item.descriptionKey && (
                <span className="text-xs text-[var(--text-muted)]">{t(item.descriptionKey)}</span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MarketingHeader() {
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--p-border)] bg-[var(--p-surface)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
        <Link
          href="/"
          // Canonical ATLVS primary lockup — Waypoint mark + spaced
          // wordmark per ui_kits/atlvs/logo-kit.html "Primary Lockup".
          // The mark is the bare ink star (atlvs-mark.svg, 22px); the
          // wordmark below stays nowrap so narrow viewports never break
          // it letter-by-letter into a vertical stack.
          //
          // Inter at weight 800 + tight tracking is the ATLVS product
          // canon — SaaS skin doesn't use Big Shoulders even for the
          // wordmark. Brand display is reserved for the cosmic surface
          // only. Aria-label still announces the wordmark form.
          className="flex items-center gap-2.5 leading-none text-[var(--p-text-1)]"
          onClick={() => setMobileOpen(false)}
          aria-label={t("marketing.header.brandAriaLabel")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/atlvs-mark.svg" alt="" width={22} height={22} aria-hidden="true" />
          <span className="text-[1.3rem] font-extrabold tracking-[0.04em] whitespace-nowrap uppercase">A T L V S</span>
        </Link>

        {/* Desktop primary nav — 3 dropdowns + 2 direct links = 5 visible items,
            matching Linear / Vercel / Stripe / ClickUp / Notion convention. */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label={t("marketing.header.primaryAriaLabel")}>
          <NavDropdown group={PRODUCT} />
          <NavDropdown group={INDUSTRIES} />
          <Link href="/marketplace" className="nav-item">
            {t("marketing.header.marketplace")}
          </Link>
          <Link href="/pricing" className="nav-item">
            {t("nav.pricing")}
          </Link>
          <Link href="/community" className="nav-item">
            {t("nav.community")}
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
            {t("marketing.header.login")}
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[var(--p-accent-cta)] px-4 py-2 text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition hover:brightness-95"
          >
            {t("common.startFree")}
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? t("marketing.header.closeMenu") : t("marketing.header.openMenu")}
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
            <nav className="flex flex-col gap-1" aria-label={t("marketing.header.mobilePrimaryAriaLabel")}>
              <Link href="/marketplace" className="nav-item text-base" onClick={() => setMobileOpen(false)}>
                {t("marketing.header.marketplace")}
              </Link>
              <Link href="/pricing" className="nav-item text-base" onClick={() => setMobileOpen(false)}>
                {t("nav.pricing")}
              </Link>
              <Link href="/community" className="nav-item text-base" onClick={() => setMobileOpen(false)}>
                {t("nav.community")}
              </Link>
            </nav>
            <MobileNavSection group={RESOURCES} onClick={() => setMobileOpen(false)} />
            <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">
                  {t("marketing.header.theme")}
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-[var(--text-muted)] uppercase">
                  {t("marketing.header.language")}
                </span>
                <LocaleSwitcher />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4">
              <Link
                href="/login"
                className="btn btn-ghost btn-sm w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                {t("marketing.header.login")}
              </Link>
              <Link
                href="/signup"
                className="w-full justify-center rounded-md bg-[var(--p-accent-cta)] px-4 py-2 text-center text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition hover:brightness-95"
                onClick={() => setMobileOpen(false)}
              >
                {t("common.startFree")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNavSection({ group, onClick }: { group: NavGroup; onClick: () => void }) {
  const t = useT();
  const groupLabel = t(group.labelKey);
  return (
    <details className="group" open>
      <summary className="nav-item cursor-pointer list-none text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between">
          {groupLabel}
          <ChevronDown size={12} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <nav className="ms-2 mt-1 flex flex-col gap-0.5" aria-label={groupLabel}>
        {group.items.map((item) => (
          <Link key={item.href} href={item.href} className="nav-item text-base" onClick={onClick}>
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </details>
  );
}
