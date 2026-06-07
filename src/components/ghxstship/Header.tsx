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

/**
 * GHXSTSHIP marketing header. Same primitives as the ATLVS marketing
 * header (DropdownMenu, <Button>, .ps-btn classes) so hover/active behavior
 * stays in lockstep — only the brand mark, nav groups, and accent color
 * differ.
 */

type NavLink = { label: string; href: string; description?: string };
type NavGroup = { label: string; items: NavLink[] };

const SERVICES: NavGroup = {
  label: "Services",
  items: [
    { label: "Full Catalog", href: "/ghxstship/services", description: "All 114 services" },
    { label: "Production", href: "/ghxstship/services/production", description: "Audio, lighting, video, staging" },
    { label: "Build", href: "/ghxstship/services/build", description: "Scenic, fabrication, install" },
    { label: "Hospitality", href: "/ghxstship/services/hospitality", description: "F&B, VIP, premium service" },
    { label: "Operations", href: "/ghxstship/services/operations", description: "Crew, logistics, security" },
    { label: "Experience", href: "/ghxstship/services/experience", description: "Guest experience, retail" },
    { label: "Technology", href: "/ghxstship/services/technology", description: "Networks, RFID, AR / VR" },
    { label: "Executive", href: "/ghxstship/services/executive", description: "Permits, insurance, compliance" },
    { label: "Creative", href: "/ghxstship/services/creative", description: "Design, art direction, IP" },
    { label: "Marketing", href: "/ghxstship/services/marketing", description: "Ambassadors, donor programs" },
    { label: "Talent", href: "/ghxstship/services/talent", description: "Performers, programming" },
  ],
};

const INDUSTRIES: NavGroup = {
  label: "Industries",
  items: [
    { label: "All Industries", href: "/ghxstship/solutions", description: "All 19 verticals" },
    { label: "Concerts, Festivals & Tours", href: "/ghxstship/solutions/concerts-festivals-tours" },
    { label: "Immersive Experiences", href: "/ghxstship/solutions/immersive-experiences" },
    { label: "Brand Activations & Pop-ups", href: "/ghxstship/solutions/brand-activations-popups" },
    { label: "Theme Parks & Attractions", href: "/ghxstship/solutions/amusement-theme-parks" },
    { label: "Cruise Lines & Maritime", href: "/ghxstship/solutions/cruise-lines-maritime" },
    { label: "Premium Sporting & Fan Zones", href: "/ghxstship/solutions/premium-sporting-experiences-fan-zones" },
    { label: "Premium Hospitality", href: "/ghxstship/solutions/premium-experiences-hospitality" },
    { label: "Theatrical Performances", href: "/ghxstship/solutions/theatrical-performances" },
  ],
};

const STUDIO: NavGroup = {
  label: "Studio",
  items: [
    { label: "Phases", href: "/ghxstship/phases", description: "Discovery to Wrap" },
    { label: "Experience Modes", href: "/ghxstship/tiers", description: "How audiences engage" },
    { label: "Markets", href: "/ghxstship/markets", description: "12 cities, 4 anchors" },
    { label: "About", href: "/ghxstship/about" },
    { label: "Contact", href: "/ghxstship/contact" },
  ],
};

const ALL_GROUPS = [SERVICES, INDUSTRIES, STUDIO];

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
            Pricing
          </Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button href="/ghxstship/contact" variant="secondary" size="sm">
            Contact
          </Button>
          <Button href="/ghxstship/contact" size="sm">
            Start a Project
          </Button>
        </div>
        <button
          type="button"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
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
                Pricing
              </Button>
              <Button href="/ghxstship/contact" size="sm">
                Start a Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
