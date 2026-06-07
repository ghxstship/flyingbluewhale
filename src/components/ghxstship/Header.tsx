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
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * GHXSTSHIP marketing header. Same primitives as the ATLVS marketing
 * header (DropdownMenu, <Button>, .ps-btn classes) so hover/active behavior
 * stays in lockstep — only the brand mark, nav groups, and accent color
 * differ.
 */

type NavLink = { label: string; href: string; description?: string };
type NavGroup = { label: string; items: NavLink[] };

type Translate = ReturnType<typeof useT>;

function buildGroups(t: Translate): NavGroup[] {
  const SERVICES: NavGroup = {
    label: t("ghxstship.header.services.label", undefined, "Services"),
    items: [
      {
        label: t("ghxstship.header.services.fullCatalog.label", undefined, "Full Catalog"),
        href: "/ghxstship/services",
        description: t("ghxstship.header.services.fullCatalog.description", undefined, "All 114 services"),
      },
      {
        label: t("ghxstship.header.services.production.label", undefined, "Production"),
        href: "/ghxstship/services/production",
        description: t(
          "ghxstship.header.services.production.description",
          undefined,
          "Audio, lighting, video, staging",
        ),
      },
      {
        label: t("ghxstship.header.services.build.label", undefined, "Build"),
        href: "/ghxstship/services/build",
        description: t("ghxstship.header.services.build.description", undefined, "Scenic, fabrication, install"),
      },
      {
        label: t("ghxstship.header.services.hospitality.label", undefined, "Hospitality"),
        href: "/ghxstship/services/hospitality",
        description: t("ghxstship.header.services.hospitality.description", undefined, "F&B, VIP, premium service"),
      },
      {
        label: t("ghxstship.header.services.operations.label", undefined, "Operations"),
        href: "/ghxstship/services/operations",
        description: t("ghxstship.header.services.operations.description", undefined, "Crew, logistics, security"),
      },
      {
        label: t("ghxstship.header.services.experience.label", undefined, "Experience"),
        href: "/ghxstship/services/experience",
        description: t("ghxstship.header.services.experience.description", undefined, "Guest experience, retail"),
      },
      {
        label: t("ghxstship.header.services.technology.label", undefined, "Technology"),
        href: "/ghxstship/services/technology",
        description: t("ghxstship.header.services.technology.description", undefined, "Networks, RFID, AR / VR"),
      },
      {
        label: t("ghxstship.header.services.executive.label", undefined, "Executive"),
        href: "/ghxstship/services/executive",
        description: t("ghxstship.header.services.executive.description", undefined, "Permits, insurance, compliance"),
      },
      {
        label: t("ghxstship.header.services.creative.label", undefined, "Creative"),
        href: "/ghxstship/services/creative",
        description: t("ghxstship.header.services.creative.description", undefined, "Design, art direction, IP"),
      },
      {
        label: t("ghxstship.header.services.marketing.label", undefined, "Marketing"),
        href: "/ghxstship/services/marketing",
        description: t("ghxstship.header.services.marketing.description", undefined, "Ambassadors, donor programs"),
      },
      {
        label: t("ghxstship.header.services.talent.label", undefined, "Talent"),
        href: "/ghxstship/services/talent",
        description: t("ghxstship.header.services.talent.description", undefined, "Performers, programming"),
      },
    ],
  };

  const INDUSTRIES: NavGroup = {
    label: t("ghxstship.header.industries.label", undefined, "Industries"),
    items: [
      {
        label: t("ghxstship.header.industries.all.label", undefined, "All Industries"),
        href: "/ghxstship/solutions",
        description: t("ghxstship.header.industries.all.description", undefined, "All 19 verticals"),
      },
      {
        label: t("ghxstship.header.industries.concertsFestivalsTours", undefined, "Concerts, Festivals & Tours"),
        href: "/ghxstship/solutions/concerts-festivals-tours",
      },
      {
        label: t("ghxstship.header.industries.immersiveExperiences", undefined, "Immersive Experiences"),
        href: "/ghxstship/solutions/immersive-experiences",
      },
      {
        label: t("ghxstship.header.industries.brandActivationsPopups", undefined, "Brand Activations & Pop-ups"),
        href: "/ghxstship/solutions/brand-activations-popups",
      },
      {
        label: t("ghxstship.header.industries.themeParksAttractions", undefined, "Theme Parks & Attractions"),
        href: "/ghxstship/solutions/amusement-theme-parks",
      },
      {
        label: t("ghxstship.header.industries.cruiseLinesMaritime", undefined, "Cruise Lines & Maritime"),
        href: "/ghxstship/solutions/cruise-lines-maritime",
      },
      {
        label: t("ghxstship.header.industries.premiumSportingFanZones", undefined, "Premium Sporting & Fan Zones"),
        href: "/ghxstship/solutions/premium-sporting-experiences-fan-zones",
      },
      {
        label: t("ghxstship.header.industries.premiumHospitality", undefined, "Premium Hospitality"),
        href: "/ghxstship/solutions/premium-experiences-hospitality",
      },
      {
        label: t("ghxstship.header.industries.theatricalPerformances", undefined, "Theatrical Performances"),
        href: "/ghxstship/solutions/theatrical-performances",
      },
    ],
  };

  const STUDIO: NavGroup = {
    label: t("ghxstship.header.studio.label", undefined, "Studio"),
    items: [
      {
        label: t("ghxstship.header.studio.phases.label", undefined, "Phases"),
        href: "/ghxstship/phases",
        description: t("ghxstship.header.studio.phases.description", undefined, "Discovery to Wrap"),
      },
      {
        label: t("ghxstship.header.studio.experienceModes.label", undefined, "Experience Modes"),
        href: "/ghxstship/tiers",
        description: t("ghxstship.header.studio.experienceModes.description", undefined, "How audiences engage"),
      },
      {
        label: t("ghxstship.header.studio.markets.label", undefined, "Markets"),
        href: "/ghxstship/markets",
        description: t("ghxstship.header.studio.markets.description", undefined, "12 cities, 4 anchors"),
      },
      { label: t("ghxstship.header.studio.about", undefined, "About"), href: "/ghxstship/about" },
      { label: t("ghxstship.header.studio.contact", undefined, "Contact"), href: "/ghxstship/contact" },
    ],
  };

  return [SERVICES, INDUSTRIES, STUDIO];
}

function DesktopGroup({ group }: { group: NavGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-[280px]">
        <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {group.items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="block w-full">
              <div className="text-sm font-medium">{item.label}</div>
              {item.description && <div className="mt-0.5 text-xs text-[var(--p-text-2)]">{item.description}</div>}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GhxstshipHeader() {
  const [open, setOpen] = useState(false);
  const t = useT();
  const ALL_GROUPS = buildGroups(t);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--p-border)] bg-[var(--p-bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--p-bg)]/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/ghxstship"
          className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] uppercase"
          aria-label="GHXSTSHIP Industries — home"
        >
          <span aria-hidden className="inline-block h-2.5 w-2.5" style={{ background: "var(--p-accent-text)" }} />G H X
          S T S H I P
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {ALL_GROUPS.map((g) => (
            <DesktopGroup key={g.label} group={g} />
          ))}
          <Link
            href="/ghxstship/pricing"
            className="rounded px-3 py-2 text-sm font-medium text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
          >
            {t("ghxstship.header.pricing", undefined, "Pricing")}
          </Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button href="/ghxstship/contact" variant="secondary" size="sm">
            {t("ghxstship.header.contact", undefined, "Contact")}
          </Button>
          <Button href="/ghxstship/contact" size="sm">
            {t("ghxstship.header.startProject", undefined, "Start a Project")}
          </Button>
        </div>
        <button
          type="button"
          className="md:hidden"
          aria-label={
            open
              ? t("ghxstship.header.closeMenu", undefined, "Close menu")
              : t("ghxstship.header.openMenu", undefined, "Open menu")
          }
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--p-border)] bg-[var(--p-bg)] md:hidden">
          <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
            {ALL_GROUPS.map((g) => (
              <div key={g.label}>
                <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
                  {g.label}
                </div>
                <ul className="mt-3 space-y-2">
                  {g.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block text-sm text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button href="/ghxstship/pricing" variant="secondary" size="sm">
                {t("ghxstship.header.pricing", undefined, "Pricing")}
              </Button>
              <Button href="/ghxstship/contact" size="sm">
                {t("ghxstship.header.startProject", undefined, "Start a Project")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
