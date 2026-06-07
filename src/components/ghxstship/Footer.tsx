import Link from "next/link";
import { CLASSES } from "@/lib/ghxstship/classes";
import { SOLUTIONS } from "@/lib/ghxstship/solutions";
import { ANCHOR_MARKETS } from "@/lib/ghxstship/markets";
import { paths } from "@/lib/ghxstship";
import { SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

type Translate = Awaited<ReturnType<typeof getRequestT>>["t"];

function buildColumns(t: Translate): Array<{ heading: string; items: Array<{ label: string; href: string }> }> {
  return [
    {
      heading: t("ghxstship.footer.services", undefined, "Services"),
      items: CLASSES.map((c) => ({
        label: c.shortName,
        href: paths.classDetail(c.slug),
      })),
    },
    {
      heading: t("ghxstship.footer.topIndustries", undefined, "Top Industries"),
      items: SOLUTIONS.slice(0, 9).map((s) => ({
        label: s.name,
        href: paths.solutionDetail(s.slug),
      })),
    },
    {
      heading: t("ghxstship.footer.anchorMarkets", undefined, "Anchor Markets"),
      items: [
        ...ANCHOR_MARKETS.map((m) => ({ label: m.name, href: paths.marketDetail(m.slug) })),
        { label: t("ghxstship.footer.allMarkets", undefined, "All Markets"), href: paths.marketsRoot() },
      ],
    },
    {
      heading: t("ghxstship.footer.studio", undefined, "Studio"),
      items: [
        { label: t("ghxstship.footer.about", undefined, "About"), href: paths.about() },
        { label: t("ghxstship.footer.pricing", undefined, "Pricing"), href: paths.pricing() },
        { label: t("ghxstship.footer.phases", undefined, "Phases"), href: paths.phasesRoot() },
        { label: t("ghxstship.footer.experienceModes", undefined, "Experience Modes"), href: paths.tiersRoot() },
        { label: t("ghxstship.footer.contact", undefined, "Contact"), href: paths.contact() },
      ],
    },
  ];
}

export async function GhxstshipFooter() {
  const { t } = await getRequestT();
  const COLUMNS = buildColumns(t);
  return (
    <footer className="mt-24 border-t border-[var(--p-border)] bg-[var(--p-surface)]">
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
            <p className="mt-3 text-xs text-[var(--p-text-2)]">
              {t("ghxstship.footer.tagline.line1", undefined, "Experiential production company.")}
              <br />
              {t("ghxstship.footer.tagline.line2", undefined, "Festivals. Theme parks. Theatre.")}
              <br />
              {t("ghxstship.footer.tagline.line3", undefined, "Built once, run anywhere.")}
            </p>
            <div className="mt-4 flex gap-3 text-xs text-[var(--p-text-2)]">
              <a href={SITE.baseUrl} className="hover:text-[var(--p-text-1)]">
                ATLVS Technologies →
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="text-[11px] font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
                {col.heading}
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-[var(--p-border)] pt-6 text-xs text-[var(--p-text-2)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>© {new Date().getFullYear()} GHXSTSHIP Industries LLC</span>
            <span>Miami · New York · Chicago · Los Angeles</span>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed">
            {t(
              "ghxstship.footer.operatingBrands",
              undefined,
              "ATLVS, GVTEWAY, and COMPVSS are operating brands of ATLVS Technologies, a GHXSTSHIP Industries company.",
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
