import { MarketingHeader } from "@/components/MarketingHeader";
import Link from "next/link";
import { WebVitalsReporter } from "@/components/marketing/WebVitalsReporter";
import { StickyCTABar } from "@/components/marketing/StickyCTABar";

const FOOTER_NAV: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    items: [
      { label: "Solutions", href: "/solutions" },
      { label: "ATLVS", href: "/solutions/atlvs" },
      { label: "GVTEWAY", href: "/solutions/gvteway" },
      { label: "COMPVSS", href: "/solutions/compvss" },
      { label: "Features", href: "/features" },
      { label: "AI", href: "/ai" },
      { label: "Integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Built For",
    items: [
      { label: "Tour Managers", href: "/teams/tour-managers" },
      { label: "Production Managers", href: "/teams/production-managers" },
      { label: "Stage Managers", href: "/teams/stage-managers" },
      { label: "Festival Directors", href: "/teams/festival-directors" },
      { label: "Site Managers", href: "/teams/site-managers" },
      { label: "Tech Directors", href: "/teams/technical-directors" },
      { label: "Talent Buyers", href: "/teams/talent-buyers" },
      { label: "EHS Leads", href: "/teams/hse-leads" },
    ],
  },
  {
    heading: "Industries",
    items: [
      { label: "Live Events", href: "/solutions/live-events" },
      { label: "Concerts", href: "/solutions/concerts" },
      { label: "Festivals & Tours", href: "/solutions/festivals-tours" },
      { label: "Immersive", href: "/solutions/immersive-experiences" },
      { label: "Brand Activations", href: "/solutions/brand-activations" },
      { label: "Corporate", href: "/solutions/corporate-events" },
      { label: "Theatrical", href: "/solutions/theatrical-performances" },
      { label: "Broadcast / TV / Film", href: "/solutions/broadcast-tv-film" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Docs", href: "/docs" },
      { label: "Guides", href: "/guides" },
      { label: "Glossary", href: "/glossary" },
      { label: "Templates", href: "/templates" },
      { label: "Tools", href: "/tools" },
      { label: "Blog", href: "/blog" },
      { label: "Community", href: "/community" },
      { label: "Help", href: "/help" },
    ],
  },
  {
    heading: "Compare",
    items: [
      { label: "vs Cvent", href: "/compare/cvent" },
      { label: "vs Procore", href: "/compare/procore" },
      { label: "vs Eventbrite", href: "/compare/eventbrite" },
      { label: "vs Master Tour", href: "/compare/master-tour" },
      { label: "vs Monday", href: "/compare/monday" },
      { label: "vs Notion", href: "/compare/notion" },
      { label: "vs Airtable", href: "/compare/airtable" },
      { label: "vs Asana", href: "/compare/asana" },
      { label: "vs DocuSign", href: "/compare/docusign" },
      { label: "vs Salesforce", href: "/compare/salesforce" },
      { label: "All alternatives", href: "/alternatives" },
    ],
  },
  {
    heading: "Studio",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Customers", href: "/customers" },
      { label: "Press", href: "/press" },
      { label: "Partners", href: "/partners" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "DPA", href: "/legal/dpa" },
      { label: "SLA", href: "/legal/sla" },
    ],
  },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <MarketingHeader />
      <WebVitalsReporter />
      <main id="main">{children}</main>
      <StickyCTABar />
      <footer className="mt-24 border-t border-[var(--border-color)] bg-[var(--surface-inset)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-7">
            <div className="md:col-span-1">
              <Link
                href="/"
                className="text-base font-semibold tracking-[0.18em] whitespace-nowrap uppercase"
                aria-label="ATLVS Technologies — home"
              >
                A T L V S
              </Link>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                The platform for production. Three apps, one schema.
              </p>
              <div className="mt-4 flex gap-3 text-xs text-[var(--text-muted)]">
                <a
                  href="https://twitter.com/atlvs.pro"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--text-primary)]"
                >
                  Twitter
                </a>
                <a
                  href="https://github.com/ghxstship"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--text-primary)]"
                >
                  GitHub
                </a>
              </div>
            </div>
            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <div className="eyebrow">{col.heading}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--text-muted)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>© {new Date().getFullYear()} ATLVS Technologies</span>
              <span>Production runs on it.</span>
            </div>
            <div className="mt-3 text-[11px] leading-relaxed">
              ATLVS, GVTEWAY, and COMPVSS are registered trademarks of ATLVS Technologies, a{" "}
              <span className="font-medium tracking-[0.18em] text-[var(--text-secondary)]">G H X S T S H I P</span>{" "}
              Industries company.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
