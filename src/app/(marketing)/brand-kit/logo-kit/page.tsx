/**
 * /brand-kit/logo-kit — ATLVS Technologies logo reference page.
 *
 * Port of project/ui_kits/atlvs/logo-kit.html from the v4 GHXSTSHIP
 * design handoff bundle. Documents the ATLVS Waypoint mark (8-point
 * navigational star) as the canonical product mark, distinct from the
 * cosmic GHXSTSHIP ghost-ship skull (parent-company mark only).
 *
 * Renders the primary lockup (light + dark), per-product app-icons
 * (atlvs/compvss/gvteway/ink), favicon size waterfall, clearspace
 * rule, endorsement lockup, and the Do/Don't grid — all per
 * ui_kits/atlvs/logo-kit.html.
 *
 * This page paints in the ATLVS Technologies SaaS register (neutral
 * canvas, Inter type) — it documents the ATLVS product mark, not the
 * legacy cosmic brand. The data-theme override pins the SaaS skin
 * regardless of the visitor's cookie pref on the rest of the (marketing)
 * shell.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getRequestT } from "@/lib/i18n/request";
import "./logo-kit.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t("marketing.logoKit.meta.title", undefined, "ATLVS Logo Kit · The Waypoint"),
    description: t(
      "marketing.logoKit.meta.description",
      undefined,
      "The ATLVS mark is the Waypoint — an 8-point navigational star with a centered void. Primary lockup, per-product app-icons, clearspace, endorsement, do/don't.",
    ),
    alternates: { canonical: "/brand-kit/logo-kit" },
  };
}

type ProductIcon = {
  slug: "atlvs" | "compvss" | "gvteway" | "ink";
  src: string;
  label: string;
  caption: string;
};

const PRODUCT_ICONS: ProductIcon[] = [
  { slug: "atlvs", src: "/brand/atlvs-icon-atlvs.svg", label: "ATLVS · pink", caption: "Producer / Internal" },
  {
    slug: "compvss",
    src: "/brand/atlvs-icon-compvss.svg",
    label: "COMPVSS · amber",
    caption: "Crew / Vendor / Talent",
  },
  { slug: "gvteway", src: "/brand/atlvs-icon-gvteway.svg", label: "GVTEWAY · cyan", caption: "Guest / Client" },
  { slug: "ink", src: "/brand/atlvs-icon-ink.svg", label: "Ink", caption: "Neutral / Suite" },
];

const SIZES: Array<{ px: number; label: string; useTile: boolean }> = [
  { px: 64, label: "64", useTile: true },
  { px: 48, label: "48", useTile: true },
  { px: 32, label: "32", useTile: true },
  { px: 16, label: "16 · bare mark", useTile: false },
];

// Wordmark sub-letters — rendered between the primary lockup's mark and
// the spaced "TECHNOLOGIES" tag underneath. Each letter is its own span
// so the row justifies edge-to-edge under the wordmark, matching the
// reference's typographic affordance.
const TECHNOLOGIES = "TECHNOLOGIES".split("");

export default async function LogoKitPage() {
  const { t } = await getRequestT();
  return (
    <div className="lk-root" data-theme="atlvs-product">
      <div className="lk-wrap">
        <header className="lk-head">
          <p className="lk-eb">{t("marketing.logoKit.eyebrow", undefined, "ATLVS Technologies · Brand")}</p>
          <h1>{t("marketing.logoKit.title", undefined, "The Logo Kit")}</h1>
          <p>
            {t(
              "marketing.logoKit.intro",
              undefined,
              "The ATLVS mark is a waypoint — an eight-point navigational star with a center void, the navigation system rendered as one geometric glyph. Neutral SaaS register; recolors per product. Distinct from the cosmic GHXSTSHIP ghost-ship skull — the parent-company mark.",
            )}
          </p>
        </header>

        <section className="lk-section">
          <h2>{t("marketing.logoKit.primaryLockup", undefined, "Primary Lockup")}</h2>
          <div className="lk-row">
            <PrimaryLockup variant="light" markAlt={t("marketing.logoKit.markAlt", undefined, "ATLVS mark")} />
            <PrimaryLockup variant="dark" markAlt={t("marketing.logoKit.markAlt", undefined, "ATLVS mark")} />
          </div>
        </section>

        <section className="lk-section">
          <h2>{t("marketing.logoKit.appIcons", undefined, "Product app-icons — one mark, three accents")}</h2>
          <div className="lk-card lk-card--pad">
            <div className="lk-icons">
              {PRODUCT_ICONS.map((icon) => (
                <div key={icon.slug} className="lk-iconcell">
                  <Image
                    src={icon.src}
                    alt={t("marketing.logoKit.iconAlt", { label: icon.label }, `${icon.label} icon`)}
                    width={88}
                    height={88}
                    className="lk-icon-tile"
                  />
                  <div className="lk-cap">
                    {icon.label}
                    <br />
                    {icon.caption}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lk-section">
          <h2>{t("marketing.logoKit.favicon", undefined, "Favicon / Min-size — the mark holds at every scale")}</h2>
          <div className="lk-card lk-card--pad">
            <div className="lk-sizes">
              {SIZES.map((s) => (
                <div key={s.label} className="lk-iconcell">
                  <Image
                    src={s.useTile ? "/brand/atlvs-icon-atlvs.svg" : "/brand/atlvs-mark.svg"}
                    alt=""
                    width={s.px}
                    height={s.px}
                    style={{
                      borderRadius: s.useTile ? `${Math.round((s.px / 128) * 28)}px` : undefined,
                    }}
                  />
                  <div className="lk-cap">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lk-section">
          <h2>
            {t("marketing.logoKit.clearspace", undefined, "Clearspace — keep margin = ½ mark height on all sides")}
          </h2>
          <div className="lk-clearbox">
            <div className="lk-clearbox-inner">
              <Image src="/brand/atlvs-mark.svg" alt="" width={54} height={54} />
              <div className="lk-wm" style={{ fontSize: 22 }}>
                A T L V S
              </div>
            </div>
          </div>
        </section>

        <section className="lk-section">
          <h2>{t("marketing.logoKit.endorsement", undefined, "Endorsement — ATLVS + GHXSTSHIP parent")}</h2>
          <div className="lk-card lk-endorse">
            <Image src="/brand/atlvs-mark.svg" alt="" width={44} height={44} />
            <div className="lk-wm" style={{ fontSize: 22 }}>
              A T L V S
            </div>
            <div className="lk-endorse-div" />
            <Image src="/brand/logo-ghostship-skull.svg" alt="" width={30} height={30} className="lk-endorse-skull" />
            <div className="lk-mono lk-endorse-cap">
              a G H X S T S H I P
              <br />
              {t("marketing.logoKit.parentCompany", undefined, "Industries company")}
            </div>
          </div>
        </section>

        <section className="lk-section">
          <h2>{t("marketing.logoKit.doDont", undefined, "Do · Don’t")}</h2>
          <div className="lk-dd">
            <div className="lk-do">
              <b>{t("marketing.logoKit.do", undefined, "Do")}</b>
              <ul>
                <li>
                  {t(
                    "marketing.logoKit.do1",
                    undefined,
                    "Recolor the tile to the product accent; keep the mark white — or ink on light.",
                  )}
                </li>
                <li>{t("marketing.logoKit.do2", undefined, "Maintain clearspace = ½ mark height.")}</li>
                <li>{t("marketing.logoKit.do3", undefined, "Use the bare mark at ≤16px; the tiled icon at ≥32px.")}</li>
                <li>
                  {t("marketing.logoKit.do4Prefix", undefined, "Pair with the spaced")}{" "}
                  <b>A&nbsp;T&nbsp;L&nbsp;V&nbsp;S</b>{" "}
                  {t("marketing.logoKit.do4Suffix", undefined, "wordmark, nowrap.")}
                </li>
              </ul>
            </div>
            <div className="lk-dont">
              <b>{t("marketing.logoKit.dont", undefined, "Don’t")}</b>
              <ul>
                <li>
                  {t(
                    "marketing.logoKit.dont1",
                    undefined,
                    "Recolor or gradient the star itself — only the tile carries color.",
                  )}
                </li>
                <li>
                  {t("marketing.logoKit.dont2", undefined, "Rotate, stretch, or add the cosmic halftone/skull to it.")}
                </li>
                <li>{t("marketing.logoKit.dont3", undefined, "Set the wordmark unspaced or lowercase.")}</li>
                <li>
                  {t("marketing.logoKit.dont4", undefined, "Place the mark on a busy photo without the solid tile.")}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <p className="lk-foot">
          <Link href="/brand-kit" className="lk-link">
            {t("marketing.logoKit.back", undefined, "← Back to the brand kit")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function PrimaryLockup({ variant, markAlt }: { variant: "light" | "dark"; markAlt: string }) {
  const isDark = variant === "dark";
  return (
    <div className={["lk-card", "lk-lockup", isDark ? "lk-lockup--dark" : null].filter(Boolean).join(" ")}>
      <Image
        src={isDark ? "/brand/atlvs-mark-white.svg" : "/brand/atlvs-mark.svg"}
        alt={markAlt}
        width={64}
        height={64}
      />
      <div className="lk-lk">
        <div className="lk-wm lk-wm--lg">A T L V S</div>
        <div className="lk-sub">
          {TECHNOLOGIES.map((letter, i) => (
            <span key={`${letter}-${i}`}>{letter}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
