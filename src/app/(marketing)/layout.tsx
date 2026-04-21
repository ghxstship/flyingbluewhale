import { MarketingHeader } from "@/components/MarketingHeader";
import Link from "next/link";
import { WebVitalsReporter } from "@/components/marketing/WebVitalsReporter";

const FOOTER_NAV: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    items: [
      { label: "Solutions", href: "/solutions" },
      { label: "ATLVS Console", href: "/solutions/atlvs" },
      { label: "GVTEWAY Portals", href: "/solutions/gvteway" },
      { label: "COMPVSS Mobile", href: "/solutions/compvss" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Industries",
    items: [
      { label: "Live Events", href: "/solutions/live-events" },
      { label: "Concerts", href: "/solutions/concerts" },
      { label: "Festivals & Tours", href: "/solutions/festivals-tours" },
      { label: "Immersive Experiences", href: "/solutions/immersive-experiences" },
      { label: "Brand Activations", href: "/solutions/brand-activations" },
      { label: "Corporate Events", href: "/solutions/corporate-events" },
      { label: "Theatrical Performances", href: "/solutions/theatrical-performances" },
      { label: "Broadcast, TV & Film", href: "/solutions/broadcast-tv-film" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Customers", href: "/customers" },
      { label: "Compare", href: "/compare" },
      { label: "Guides", href: "/guides" },
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
      { label: "Trust", href: "/trust" },
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
      <main>{children}</main>
      <footer className="mt-24 border-t border-[var(--border-color)] bg-[var(--surface-inset)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-1">
              <Link
                href="/"
                className="text-base font-semibold tracking-[0.18em] uppercase"
                aria-label="Second Star Technologies — home"
              >
                SECOND STVR
              </Link>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                The unified production platform — ATLVS, GVTEWAY, COMPVSS. One schema. Three shells.
              </p>
              <div className="mt-4 flex gap-3 text-xs text-[var(--text-muted)]">
                <a href="https://twitter.com/secondstartech" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)]">Twitter</a>
                <a href="https://github.com/ghxstship" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)]">GitHub</a>
              </div>
            </div>
            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {col.heading}
                </div>
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
              <span>© {new Date().getFullYear()} Second Star Technologies</span>
              <span>Built for production teams who are tired of duct tape.</span>
            </div>
            <div className="mt-3 text-[11px] leading-relaxed">
              ATLVS, GVTEWAY, and COMPVSS are registered trademarks of Second Star
              Technologies, a{" "}
              <span className="font-medium tracking-[0.18em] text-[var(--text-secondary)]">
                G H X S T S H I P
              </span>{" "}
              Industries company.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
