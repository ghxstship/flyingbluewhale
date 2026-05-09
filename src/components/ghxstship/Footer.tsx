import Link from "next/link";
import { CLASSES } from "@/lib/ghxstship/classes";
import { SOLUTIONS } from "@/lib/ghxstship/solutions";
import { ANCHOR_MARKETS } from "@/lib/ghxstship/markets";
import { paths } from "@/lib/ghxstship";
import { SITE } from "@/lib/seo";

const COLUMNS: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: "Services",
    items: CLASSES.map((c) => ({
      label: c.shortName,
      href: paths.classDetail(c.slug),
    })),
  },
  {
    heading: "Top Industries",
    items: SOLUTIONS.slice(0, 9).map((s) => ({
      label: s.name,
      href: paths.solutionDetail(s.slug),
    })),
  },
  {
    heading: "Anchor Markets",
    items: [
      ...ANCHOR_MARKETS.map((m) => ({ label: m.name, href: paths.marketDetail(m.slug) })),
      { label: "All Markets", href: paths.marketsRoot() },
    ],
  },
  {
    heading: "Studio",
    items: [
      { label: "About", href: paths.about() },
      { label: "Pricing", href: paths.pricing() },
      { label: "Phases", href: paths.phasesRoot() },
      { label: "Experience Modes", href: paths.tiersRoot() },
      { label: "Contact", href: paths.contact() },
    ],
  },
];

export function GhxstshipFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link
              href={paths.root()}
              className="text-base font-semibold tracking-[0.18em] uppercase"
              aria-label="GHXSTSHIP Industries — home"
            >
              G H X S T S H I P
            </Link>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Experiential production company.
              <br />
              Festivals. Theme parks. Theatre.
              <br />
              Built once, run anywhere.
            </p>
            <div className="mt-4 flex gap-3 text-xs text-[var(--text-muted)]">
              <a href={SITE.baseUrl} className="hover:text-[var(--text-primary)]">
                LYTEHAUS Technologies →
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
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
            <span>© {new Date().getFullYear()} GHXSTSHIP Industries LLC</span>
            <span>Miami · New York · Chicago · Los Angeles</span>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed">
            ATLVS, GVTEWAY, and COMPVSS are operating brands of LYTEHAUS Technologies, a GHXSTSHIP Industries company.
          </div>
        </div>
      </div>
    </footer>
  );
}
