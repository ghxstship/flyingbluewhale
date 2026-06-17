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
import { Wordmark } from "@/components/brand/Wordmark";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  marketingHeaderGroups,
  marketingHeaderPrimaryLinks,
  marketingAuthLinks,
  type MarketingNavGroup,
} from "@/lib/nav";

/**
 * Marketing header — three grouped dropdowns + two direct links + a
 * primary CTA, plus a utility cluster (locale / light-dark) on the
 * right. The legacy 8-theme design picker was retired with the ATLVS-kit
 * lock — the platform now ships a single ATLVS product skin and the
 * mode toggle is the only visible appearance affordance.
 */

// Nav data is the single source of truth in `src/lib/nav.ts` (reconciled by
// `scripts/generate-sitemap.mjs`). Labels are i18n catalog keys resolved with
// `t()` at render, so untranslated locales degrade to English, not dot-paths.
const [PRODUCT, INDUSTRIES, RESOURCES] = marketingHeaderGroups;

function NavDropdown({ group }: { group: MarketingNavGroup }) {
  const t = useT();
  const groupLabel = t(group.labelKey);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="nav-item inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-accent)]"
        >
          {groupLabel}
          <ChevronDown size={12} aria-hidden="true" className="text-[var(--p-text-2)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2" style={{ background: "var(--p-bg)" }}>
        <DropdownMenuLabel>{groupLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="cursor-pointer p-2">
            <Link href={item.href} className="flex w-full flex-col items-start gap-0.5">
              <span className="text-sm font-medium text-[var(--p-text-1)]">{t(item.labelKey)}</span>
              {item.descriptionKey && <span className="text-xs text-[var(--p-text-2)]">{t(item.descriptionKey)}</span>}
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
          // Canonical ATLVS Technologies primary lockup — Waypoint mark +
          // Jost crossbar-less wordmark with TECHNOLOGIES subtitle, per
          // design_handoff_atlvs_kit/wordmarks.html. The mark is the bare
          // ink star (atlvs-mark.svg, 22px); the wordmark stays nowrap so
          // narrow viewports never break it letter-by-letter.
          className="flex items-end gap-2.5 leading-none text-[var(--p-text-1)]"
          onClick={() => setMobileOpen(false)}
          aria-label={t("marketing.header.brandAriaLabel")}
        >
          {/* Waypoint mark, inlined so it inverts with the theme. The asset
              atlvs-mark.svg is filled with the dark ink (#181B23) and vanishes on
              the dark header (only its white center showed — the stray dot). Using
              currentColor (the link's --p-text-1) keeps the star visible on both
              light and dark; the center punches a hole with the surface color. */}
          <svg viewBox="0 0 64 64" width={22} height={22} aria-hidden="true" className="shrink-0">
            <path d="M32 5 L37 27 L59 32 L37 37 L32 59 L27 37 L5 32 L27 27 Z" fill="currentColor" />
            <circle cx="32" cy="32" r="4.2" fill="var(--p-surface)" />
          </svg>
          <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 18, fontWeight: 500 }} />
        </Link>

        {/* Desktop primary nav — 3 dropdowns + 3 direct links. Switches in
            at xl (1280px): the full cluster measures ~1090px, so at lg/1024
            it overflowed the viewport (readiness matrix, tablet-lg). Below
            1280px the hamburger sheet takes over. */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label={t("marketing.header.primaryAriaLabel")}>
          <NavDropdown group={PRODUCT} />
          <NavDropdown group={INDUSTRIES} />
          {marketingHeaderPrimaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-item">
              {t(link.labelKey)}
            </Link>
          ))}
          <NavDropdown group={RESOURCES} />
        </nav>

        {/* Desktop right cluster — utility icons (locale / mode) +
            Log In (secondary text link) + Start free (primary CTA). */}
        <div className="hidden items-center gap-2 xl:flex">
          <LocaleSwitcher />
          <ThemeToggle />
          <div aria-hidden="true" className="mx-1 h-5 w-px bg-[var(--p-border)]" />
          <Link
            href={marketingAuthLinks.login.href}
            className="text-sm font-medium whitespace-nowrap text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          >
            {t(marketingAuthLinks.login.labelKey)}
          </Link>
          <Link
            href={marketingAuthLinks.signup.href}
            className="rounded-md bg-[var(--p-accent-cta)] px-4 py-2 text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition-[filter] hover:brightness-95"
          >
            {t(marketingAuthLinks.signup.labelKey)}
          </Link>
        </div>

        {/* Mobile trigger — wrapped in a span so visibility is governed by the
            wrapper's `xl:hidden`, not the button itself. The kit's
            `[data-ui="saas"] .ps-btn { display: inline-flex }` rule has
            higher specificity than Tailwind's `.xl:hidden`, so applying
            `xl:hidden` directly to the .ps-btn button does NOT hide it at
            desktop widths. Hiding the wrapper short-circuits the button's
            display entirely. */}
        <span className="xl:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("marketing.header.closeMenu") : t("marketing.header.openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-sheet"
            className="ps-btn ps-btn--ghost ps-btn--sm"
          >
            {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </span>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div id="mobile-nav-sheet" className="border-t border-[var(--p-border)] bg-[var(--p-bg)] xl:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5">
            <MobileNavSection group={PRODUCT} onClick={() => setMobileOpen(false)} />
            <MobileNavSection group={INDUSTRIES} onClick={() => setMobileOpen(false)} />
            <nav className="flex flex-col gap-1" aria-label={t("marketing.header.mobilePrimaryAriaLabel")}>
              {marketingHeaderPrimaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-item text-base"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
            <MobileNavSection group={RESOURCES} onClick={() => setMobileOpen(false)} />
            <div className="flex flex-col gap-2 border-t border-[var(--p-border)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-[var(--p-text-2)] uppercase">
                  {t("marketing.header.theme")}
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium tracking-wider text-[var(--p-text-2)] uppercase">
                  {t("marketing.header.language")}
                </span>
                <LocaleSwitcher />
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-[var(--p-border)] pt-4">
              <Link
                href={marketingAuthLinks.login.href}
                className="ps-btn ps-btn--ghost ps-btn--sm w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                {t(marketingAuthLinks.login.labelKey)}
              </Link>
              <Link
                href={marketingAuthLinks.signup.href}
                className="w-full justify-center rounded-md bg-[var(--p-accent-cta)] px-4 py-2 text-center text-sm font-semibold text-[var(--p-accent-cta-contrast)] transition-[filter] hover:brightness-95"
                onClick={() => setMobileOpen(false)}
              >
                {t(marketingAuthLinks.signup.labelKey)}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNavSection({ group, onClick }: { group: MarketingNavGroup; onClick: () => void }) {
  const t = useT();
  const groupLabel = t(group.labelKey);
  return (
    <details className="group" open>
      <summary className="nav-item cursor-pointer list-none text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase [&::-webkit-details-marker]:hidden">
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
