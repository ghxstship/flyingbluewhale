import { MarketingHeader } from "@/components/MarketingHeader";
import Link from "next/link";
import Image from "next/image";
import {
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  LinkedinLogo,
  SoundcloudLogo,
  ThreadsLogo,
  FacebookLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { WebVitalsReporter } from "@/components/marketing/WebVitalsReporter";
import { StickyCTABar } from "@/components/marketing/StickyCTABar";
import { getRequestT } from "@/lib/i18n/request";
import { BRAND } from "@/lib/brand";
import { marketingFooterGroups } from "@/lib/nav";

/** Phosphor brand glyph per BRAND.socials key. */
const SOCIAL_ICONS: Record<string, typeof InstagramLogo> = {
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  youtube: YoutubeLogo,
  linkedin: LinkedinLogo,
  soundcloud: SoundcloudLogo,
  threads: ThreadsLogo,
  facebook: FacebookLogo,
};

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getRequestT();
  // Single-skin lock: the marketing site uses the same neutral SaaS skin as the
  // console (Hanken Grotesk body, Anton display, soft elevation, neutral
  // surfaces). It is ECOSYSTEM marketing, not a product surface, so it carries
  // the GHXSTSHIP house accent — ATLVS volcanic red (v8 palette-locked; retired
  // the house green, which read poorly in light mode). The per-product hues
  // (COMPVSS yellow, GVTEWAY blue, …) appear only on the product cards/consoles.
  return (
    <div data-ui="saas" data-theme="atlvs-product" data-product="ghxstship" data-platform="ghxstship" className="page-shell">
      <MarketingHeader />
      <WebVitalsReporter />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <StickyCTABar />
      <footer className="mt-24 border-t border-[var(--p-border)] bg-[var(--p-surface-2)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-7">
            <div className="md:col-span-1">
              {/* Canonical ATLVS Technologies primary lockup — Waypoint mark
                  + Jost crossbar-less wordmark with TECHNOLOGIES subtitle, per
                  design_handoff_atlvs_kit/wordmarks.html. The mark + wordmark
                  bottom-align via baseline. */}
              <Link
                href="/"
                className="inline-flex items-end gap-2 whitespace-nowrap"
                aria-label={t("marketing.layout.footer.brand.homeAriaLabel")}
              >
                <Image src="/brand/atlvs-mark.svg" alt="" width={22} height={22} aria-hidden="true" />
                <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 16, fontWeight: 500 }} />
              </Link>
              <p className="mt-3 text-xs text-[var(--p-text-2)]">{t("marketing.layout.footer.brand.tagline")}</p>
              {/* Company social presence — the parent GHXSTSHIP profiles
                  (SSOT: src/lib/brand.ts `socials`, mirrored from
                  linktr.ee/ghxstship). ATLVS Technologies has no separate
                  accounts. */}
              <div className="mt-4 flex flex-wrap gap-3 text-[var(--p-text-2)]">
                {BRAND.socials.map((s) => {
                  const Glyph = SOCIAL_ICONS[s.key];
                  return (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
                    >
                      {Glyph ? <Glyph size={18} weight="regular" aria-hidden="true" /> : s.label}
                    </a>
                  );
                })}
              </div>
            </div>
            {/* Legal renders in the bottom bar (below), not as a 7th column —
                brand + 6 groups fills the lg:grid-cols-7 row exactly. */}
            {marketingFooterGroups
              .filter((col) => col.labelKey !== "marketing.layout.footer.legal.heading")
              .map((col) => (
              <div key={col.labelKey}>
                <div className="eyebrow">{t(col.labelKey)}</div>
                <ul className="mt-4 space-y-2 text-sm">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-[var(--p-border)] pt-6 text-xs text-[var(--p-text-2)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{t("marketing.layout.footer.copyright", { year: new Date().getFullYear() })}</span>
                {marketingFooterGroups
                  .find((g) => g.labelKey === "marketing.layout.footer.legal.heading")
                  ?.items.map((item) => (
                    <Link key={item.href} href={item.href} className="hover:text-[var(--p-text-1)]">
                      {t(item.labelKey)}
                    </Link>
                  ))}
              </div>
              <span>{t("marketing.layout.footer.tagline")}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-relaxed">
              {t("marketing.layout.footer.trademarkPrefix")}{" "}
              {/* GHXSTSHIP parent endorsement lockup — small ink-tile skull
                  paired with the Jost crossbar-less wordmark. The skull is
                  the parent-company mark, NEVER the ATLVS product icon. */}
              <Image
                src="/brand/logo-ghostship-skull.svg"
                alt=""
                width={14}
                height={14}
                aria-hidden="true"
                className="inline-block align-middle"
              />
              <Wordmark word="GHXSTSHIP" className="text-[var(--p-text-2)]" style={{ fontSize: 12, fontWeight: 500 }} />{" "}
              {t("marketing.layout.footer.trademarkSuffix")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
