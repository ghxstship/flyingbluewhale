import { MarketingHeader } from "@/components/Shell";
import Link from "next/link";

const FOOTER_NAV: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    items: [
      { label: "Solutions", href: "/solutions" },
      { label: "ATLVS console", href: "/solutions/atlvs" },
      { label: "GVTEWAY portals", href: "/solutions/gvteway" },
      { label: "COMPVSS mobile", href: "/solutions/compvss" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Industries",
    items: [
      { label: "Live events", href: "/solutions/live-events" },
      { label: "Touring", href: "/solutions/touring" },
      { label: "Corporate", href: "/solutions/corporate" },
      { label: "Fabrication", href: "/solutions/fabrication" },
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
      <main>{children}</main>
      <footer className="mt-24 border-t border-[var(--border-color)] bg-[var(--surface-inset)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-1">
              <Link href="/" className="text-base font-semibold tracking-tight">flyingbluewhale</Link>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                The unified production platform — ATLVS, GVTEWAY, COMPVSS. One schema. Three shells.
              </p>
              <div className="mt-4 flex gap-3 text-xs text-[var(--text-muted)]">
                <a href="https://twitter.com/flyingbluewhale" target="_blank" rel="noreferrer" className="hover:text-[var(--text-primary)]">Twitter</a>
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
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--text-muted)]">
            <span>© {new Date().getFullYear()} GHXSTSHIP · flyingbluewhale</span>
            <span>Built for production teams who are tired of duct tape.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
