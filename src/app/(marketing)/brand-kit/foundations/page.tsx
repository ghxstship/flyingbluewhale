/**
 * /brand-kit/foundations
 *
 * Faithful Next.js port of design_handoff_atlvs_kit v3 foundations.html.
 * Documents the ATLVS brand mark, color, typography, spacing, radii,
 * elevation, motion, and iconography. Every value resolves from --p-* /
 * --brand-* — no raw hex.
 *
 * i18n: prose chrome (headings, leads, notes, do/don't, captions, table
 * labels) routes through the t() catalog. Token identifiers (--p-bg),
 * brand proper nouns (ATLVS, GHXSTSHIP, Jost, Anton, Hanken Grotesk,
 * Space Mono, Phosphor, Waypoint), hex/spec values, and the typography specimen
 * samples stay literal — they are not translatable content.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  XCircle,
  Info,
  SquaresFour,
  Folders,
  CalendarBlank,
  UsersThree,
  ChartBar,
  Gear,
  Ticket,
  IdentificationBadge,
  Wallet,
  MagnifyingGlass,
  Plus,
  Funnel,
  SealCheck,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { getRequestT } from "@/lib/i18n/request";
import { PRODUCT_ACCENTS } from "@/lib/brand";
import "./foundations.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t(
      "marketing.brandKit.foundations.meta.title",
      undefined,
      "Foundations · ATLVS Technologies — Brand & UI Kit",
    ),
    description: t(
      "marketing.brandKit.foundations.meta.description",
      undefined,
      "ATLVS Technologies brand foundations: Waypoint mark, color, typography (MONUMENT — Anton + Hanken Grotesk), spacing, radii, elevation, motion, and iconography.",
    ),
    alternates: { canonical: "/brand-kit/foundations" },
  };
}

export default async function FoundationsPage() {
  const { t } = await getRequestT();
  return (
    <div className="kf-wrap">
      {/* ===== SECTION NAV ===== */}
      <aside
        className="kf-nav"
        aria-label={t("marketing.brandKit.foundations.nav.aria", undefined, "Foundations sections")}
      >
        <div className="gp">{t("marketing.brandKit.foundations.nav.brand", undefined, "Brand")}</div>
        <a href="#logo">{t("marketing.brandKit.foundations.nav.waypoint", undefined, "The Waypoint")}</a>
        <a href="#appicons">{t("marketing.brandKit.foundations.nav.appIcons", undefined, "App icons")}</a>
        <a href="#clearspace">{t("marketing.brandKit.foundations.nav.clearspace", undefined, "Clearspace & usage")}</a>
        <div className="gp">{t("marketing.brandKit.foundations.nav.foundations", undefined, "Foundations")}</div>
        <a href="#color">{t("marketing.brandKit.foundations.nav.color", undefined, "Color")}</a>
        <a href="#type">{t("marketing.brandKit.foundations.nav.typography", undefined, "Typography")}</a>
        <a href="#spacing">{t("marketing.brandKit.foundations.nav.spacing", undefined, "Spacing")}</a>
        <a href="#radii">{t("marketing.brandKit.foundations.nav.radii", undefined, "Radii")}</a>
        <a href="#elevation">{t("marketing.brandKit.foundations.nav.elevation", undefined, "Elevation")}</a>
        <a href="#motion">{t("marketing.brandKit.foundations.nav.motion", undefined, "Motion")}</a>
        <a href="#icons">{t("marketing.brandKit.foundations.nav.iconography", undefined, "Iconography")}</a>
      </aside>

      <main className="kf-main">
        {/* ===== LOGO ===== */}
        <section className="kf-sec" id="logo">
          <p className="eb">{t("marketing.brandKit.foundations.logo.eyebrow", undefined, "Brand · Logo")}</p>
          <h2>{t("marketing.brandKit.foundations.logo.heading", undefined, "The Waypoint")}</h2>
          <p className="lead">
            {t("marketing.brandKit.foundations.logo.lead.before", undefined, "The ATLVS mark is a")}{" "}
            <b>{t("marketing.brandKit.foundations.logo.lead.waypoint", undefined, "waypoint")}</b>{" "}
            {t(
              "marketing.brandKit.foundations.logo.lead.after",
              undefined,
              "— an eight-point navigational star with a center void, the navigation system rendered as one geometric glyph. Neutral SaaS register, recolored per product. It is distinct from the cosmic GHXSTSHIP ghost-ship skull, which is the parent-company mark only.",
            )}
          </p>

          <div className="kf-grid kf-grid-2">
            {/* Lockup on white tile (light affordance). The tile colors are
                FIXED brand plates — the spec demonstrates the mark on a literal
                white ground and a literal ink ground regardless of the active
                theme, so these two hexes are intentional, not theme tokens. */}
            <div className="kf-lockup">
              <span
                className="tile"
                // eslint-disable-next-line no-restricted-syntax -- intentional fixed white brand plate
                style={{ background: "#FFFFFF", border: "1px solid var(--p-border-2)" }}
                aria-hidden="true"
              >
                <Image src="/brand/atlvs-mark.svg" alt="" width={38} height={38} />
              </span>
              <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 30 }} />
            </div>
            {/* Lockup on ink tile (dark affordance) — fixed ink brand plate. */}
            <div className="kf-lockup">
              <span
                className="tile"
                // eslint-disable-next-line no-restricted-syntax -- intentional fixed ink brand plate
                style={{ background: "#0a0a0a", border: "1px solid var(--p-border-2)" }}
                aria-hidden="true"
              >
                <Image src="/brand/atlvs-mark-white.svg" alt="" width={38} height={38} />
              </span>
              <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 30 }} />
            </div>
          </div>
          <p className="kf-note" style={{ marginTop: 14 }}>
            {t(
              "marketing.brandKit.foundations.logo.note",
              undefined,
              "The tile carries the product accent; the star stays white (or ink on light grounds). The wordmark is always spaced caps and nowrap — never lowercase, never unspaced except in URLs and IDs.",
            )}
          </p>

          <table className="kf-spec" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>{t("marketing.brandKit.foundations.logo.spec.colWordmark", undefined, "Wordmark spec")}</th>
                <th>{t("marketing.brandKit.foundations.logo.spec.colSetting", undefined, "Setting")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>{t("marketing.brandKit.foundations.logo.spec.faceLabel", undefined, "Face")}</b>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--p-wordmark)" }}>Jost</span>{" "}
                  {t(
                    "marketing.brandKit.foundations.logo.spec.faceValue",
                    undefined,
                    "— geometric, logo lockup only. Headings use Anton; body & UI use Hanken Grotesk.",
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <b>{t("marketing.brandKit.foundations.logo.spec.aLabel", undefined, "The A")}</b>
                </td>
                <td>
                  {t("marketing.brandKit.foundations.logo.spec.aBefore", undefined, "A bare peak —")}{" "}
                  <b>{t("marketing.brandKit.foundations.logo.spec.aBold", undefined, "no crossbar")}</b>
                  {t(
                    "marketing.brandKit.foundations.logo.spec.aAfter",
                    undefined,
                    ", the V flipped. A and V read as mirror forms.",
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <b>{t("marketing.brandKit.foundations.logo.spec.settingLabel", undefined, "Setting")}</b>
                </td>
                <td>
                  {t(
                    "marketing.brandKit.foundations.logo.spec.settingBefore",
                    undefined,
                    "Spaced caps, nowrap. In the full lockup,",
                  )}{" "}
                  <span className="ps-mono" style={{ fontSize: 11 }}>
                    TECHNOLOGIES
                  </span>{" "}
                  {t(
                    "marketing.brandKit.foundations.logo.spec.settingAfter",
                    undefined,
                    "is letter-spaced to the exact ATLVS width.",
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <b>{t("marketing.brandKit.foundations.logo.spec.subtitleLabel", undefined, "Subtitle")}</b>
                </td>
                <td>
                  {t("marketing.brandKit.foundations.logo.spec.subtitleBefore", undefined, "Only ATLVS carries")}{" "}
                  <b>TECHNOLOGIES</b>
                  {t(
                    "marketing.brandKit.foundations.logo.spec.subtitleAfter",
                    undefined,
                    ". COMPVSS and GVTEWAY stand alone.",
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="kf-sub" style={{ marginTop: 26 }}>
            {t("marketing.brandKit.foundations.logo.productWordmarks", undefined, "Product wordmarks")}
            <span className="ln" />
          </div>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-col" style={{ gap: 28 }}>
                {[
                  { word: "ATLVS", tile: "var(--brand-atlvs)" },
                  { word: "COMPVSS", tile: "var(--brand-compvss)" },
                  { word: "GVTEWAY", tile: "var(--brand-gvteway)" },
                ].map((p) => (
                  <div key={p.word} style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <span
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        background: p.tile,
                        display: "grid",
                        placeItems: "center",
                        flex: "none",
                      }}
                      aria-hidden="true"
                    >
                      <Image src="/brand/atlvs-mark-white.svg" alt="" width={29} height={29} />
                    </span>
                    <Wordmark word={p.word} style={{ fontSize: 26 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== APP ICONS ===== */}
        <section className="kf-sec" id="appicons">
          <h2 style={{ fontSize: 20 }}>
            {t("marketing.brandKit.foundations.appIcons.heading", undefined, "One mark, three accents")}
          </h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.appIcons.lead",
              undefined,
              "Each product is the same waypoint on its own accent tile — instantly a family, instantly distinct.",
            )}
          </p>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-row" style={{ gap: 34, justifyContent: "space-between" }}>
                {[
                  {
                    tile: "var(--brand-atlvs)",
                    title: "ATLVS · pink",
                    role: t("marketing.brandKit.foundations.appIcons.roleAtlvs", undefined, "Producer / Internal"),
                  },
                  {
                    tile: "var(--brand-compvss)",
                    title: "COMPVSS · amber",
                    role: t("marketing.brandKit.foundations.appIcons.roleCompvss", undefined, "Crew / Vendor / Talent"),
                  },
                  {
                    tile: "var(--brand-gvteway)",
                    title: "GVTEWAY · blue",
                    role: t("marketing.brandKit.foundations.appIcons.roleGvteway", undefined, "Guest / Client"),
                  },
                  {
                    tile: "var(--p-text-1)",
                    title: t("marketing.brandKit.foundations.appIcons.inkTitle", undefined, "Ink"),
                    role: t("marketing.brandKit.foundations.appIcons.roleInk", undefined, "Neutral / Suite"),
                  },
                ].map((c) => (
                  <div key={c.title} className="kf-iconcell">
                    <span className="tile" style={{ background: c.tile }} aria-hidden="true">
                      <Image src="/brand/atlvs-mark-white.svg" alt="" width={52} height={52} />
                    </span>
                    <div className="cap">
                      {c.title}
                      <br />
                      {c.role}
                    </div>
                  </div>
                ))}
              </div>
              <hr className="ps-divider" style={{ margin: "24px 0" }} />
              <div className="kf-sub">
                {t(
                  "marketing.brandKit.foundations.appIcons.minSize",
                  undefined,
                  "Min-size — the mark holds at every scale",
                )}
                <span className="ln" />
              </div>
              <div className="kf-row" style={{ alignItems: "flex-end", gap: 24 }}>
                {[
                  { size: 64, radius: 15, glyph: 40, label: "64" },
                  { size: 48, radius: 12, glyph: 30, label: "48" },
                  { size: 32, radius: 8, glyph: 20, label: "32" },
                ].map((s) => (
                  <div key={s.label} className="kf-iconcell">
                    <span
                      className="tile"
                      style={{
                        width: s.size,
                        height: s.size,
                        borderRadius: s.radius,
                        background: "var(--p-accent)",
                      }}
                      aria-hidden="true"
                    >
                      <Image src="/brand/atlvs-mark-white.svg" alt="" width={s.glyph} height={s.glyph} />
                    </span>
                    <div className="cap">{s.label}</div>
                  </div>
                ))}
                <div className="kf-iconcell">
                  <span style={{ display: "grid", placeItems: "center", width: 32, height: 32 }} aria-hidden="true">
                    <Image src="/brand/atlvs-mark.svg" alt="" width={16} height={16} />
                  </span>
                  <div className="cap">
                    {t("marketing.brandKit.foundations.appIcons.bare16", undefined, "16 · bare")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CLEARSPACE / USAGE ===== */}
        <section className="kf-sec" id="clearspace">
          <h2 style={{ fontSize: 20 }}>
            {t("marketing.brandKit.foundations.clearspace.heading", undefined, "Clearspace & usage")}
          </h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.clearspace.lead",
              undefined,
              "Keep margin equal to half the mark height on every side.",
            )}
          </p>
          <div className="kf-clearbox">
            <div className="inner">
              <Image src="/brand/atlvs-mark.svg" alt="" width={50} height={50} />
              <Wordmark word="ATLVS" style={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kf-dd" style={{ marginTop: 22 }}>
            <div className="kf-do">
              <div className="h">
                <CheckCircle size={18} weight="bold" />{" "}
                {t("marketing.brandKit.foundations.clearspace.do", undefined, "Do")}
              </div>
              <ul>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.doItems.1",
                    undefined,
                    "Recolor the tile to the product accent; keep the star white (or ink on light).",
                  )}
                </li>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.doItems.2",
                    undefined,
                    "Maintain clearspace = ½ mark height.",
                  )}
                </li>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.doItems.3",
                    undefined,
                    "Use the bare mark at ≤16px; the tiled icon at ≥32px.",
                  )}
                </li>
                <li>
                  {t("marketing.brandKit.foundations.clearspace.doItems.4before", undefined, "Pair with the spaced")}{" "}
                  <b>A&nbsp;T&nbsp;L&nbsp;V&nbsp;S</b>{" "}
                  {t("marketing.brandKit.foundations.clearspace.doItems.4after", undefined, "wordmark, nowrap.")}
                </li>
              </ul>
            </div>
            <div className="kf-dont">
              <div className="h">
                <XCircle size={18} weight="bold" />{" "}
                {t("marketing.brandKit.foundations.clearspace.dont", undefined, "Don't")}
              </div>
              <ul>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.dontItems.1",
                    undefined,
                    "Recolor or gradient the star itself — only the tile carries color.",
                  )}
                </li>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.dontItems.2",
                    undefined,
                    "Rotate, stretch, or add the cosmic halftone or skull.",
                  )}
                </li>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.dontItems.3",
                    undefined,
                    "Set the wordmark unspaced or lowercase.",
                  )}
                </li>
                <li>
                  {t(
                    "marketing.brandKit.foundations.clearspace.dontItems.4",
                    undefined,
                    "Place the bare mark on a busy photo without the solid tile.",
                  )}
                </li>
              </ul>
            </div>
          </div>
          <div className="ps-banner ps-banner--info" style={{ marginTop: 18 }}>
            <Info size={18} weight="bold" />
            <div>
              <b>
                {t("marketing.brandKit.foundations.clearspace.endorsement.label", undefined, "Parent endorsement.")}
              </b>{" "}
              {t(
                "marketing.brandKit.foundations.clearspace.endorsement.body",
                undefined,
                "The GHXSTSHIP skull appears only in the endorsement lockup — “an ATLVS Technologies, a GHXSTSHIP Industries company.” It is never the product app icon.",
              )}
            </div>
          </div>
        </section>

        {/* ===== COLOR ===== */}
        <section className="kf-sec" id="color">
          <p className="eb">{t("marketing.brandKit.foundations.color.eyebrow", undefined, "Foundations · Color")}</p>
          <h2>{t("marketing.brandKit.foundations.color.heading", undefined, "Color")}</h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.color.lead.before",
              undefined,
              "Neutral surfaces do the work; one accent per product carries identity. Every value resolves from the",
            )}{" "}
            <code className="kf-code">--p-*</code>{" "}
            {t(
              "marketing.brandKit.foundations.color.lead.after",
              undefined,
              "namespace and re-tunes per mode for AA contrast.",
            )}
          </p>

          <div className="kf-sub">
            {t("marketing.brandKit.foundations.color.surfacesText", undefined, "Surfaces & text")}
            <span className="ln" />
          </div>
          <div className="kf-grid kf-grid-4">
            {[
              { name: t("marketing.brandKit.foundations.color.swatch.canvas", undefined, "Canvas"), token: "--p-bg" },
              {
                name: t("marketing.brandKit.foundations.color.swatch.surface", undefined, "Surface"),
                token: "--p-surface",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.surface2", undefined, "Surface 2"),
                token: "--p-surface-2",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.border", undefined, "Border"),
                token: "--p-border-2",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.text1", undefined, "Text 1"),
                token: "--p-text-1",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.text2", undefined, "Text 2"),
                token: "--p-text-2",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.text3", undefined, "Text 3"),
                token: "--p-text-3",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.accentLive", undefined, "Accent (live)"),
                token: "--p-accent",
              },
            ].map((s) => (
              <div key={s.token} className="kf-swatch">
                <div className="chip" style={{ background: `var(${s.token})` }} />
                <div className="meta">
                  <div className="nm">{s.name}</div>
                  <div className="hex kf-tok">{s.token}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="kf-sub">
            {t(
              "marketing.brandKit.foundations.color.productIdentity",
              undefined,
              "Product identity — the accent each app owns",
            )}
            <span className="ln" />
          </div>
          <div className="kf-col" style={{ gap: 10 }}>
            {[
              {
                name: "ATLVS",
                role: t("marketing.brandKit.foundations.appIcons.roleAtlvs", undefined, "Producer / Internal"),
                hex: PRODUCT_ACCENTS.atlvs,
                accentBg: "var(--brand-atlvs)",
                accentOn: "var(--brand-atlvs-on)",
                weakBg: "color-mix(in oklab,var(--brand-atlvs) 12%,var(--p-surface))",
                inkText: "var(--brand-atlvs-ink)",
                accentText: "accent-text #147D1C (light) · #6EE176 (dark)",
              },
              {
                name: "COMPVSS",
                role: t("marketing.brandKit.foundations.appIcons.roleCompvss", undefined, "Crew / Vendor / Talent"),
                hex: PRODUCT_ACCENTS.compvss,
                accentBg: "var(--brand-compvss)",
                accentOn: "var(--brand-compvss-on)",
                weakBg: "color-mix(in oklab,var(--brand-compvss) 14%,var(--p-surface))",
                inkText: "var(--brand-compvss-ink)",
                accentText: "accent-text #147D1C (light) · #6EE176 (dark)",
              },
              {
                name: "GVTEWAY",
                role: t("marketing.brandKit.foundations.appIcons.roleGvteway", undefined, "Guest / Client"),
                hex: PRODUCT_ACCENTS.gvteway,
                accentBg: "var(--brand-gvteway)",
                accentOn: "var(--brand-gvteway-on)",
                weakBg: "color-mix(in oklab,var(--brand-gvteway) 14%,var(--p-surface))",
                inkText: "var(--brand-gvteway-ink)",
                accentText: "accent-text #147D1C (light) · #6EE176 (dark)",
              },
            ].map((p) => (
              <div key={p.name} className="kf-idrow">
                <div className="seg" style={{ background: p.accentBg, color: p.accentOn }}>
                  <div className="nm">{p.name}</div>
                  <div className="role">{p.role}</div>
                  <div className="hx">{p.hex}</div>
                </div>
                <div className="seg" style={{ background: p.weakBg, color: "var(--p-text-1)" }}>
                  <div className="role" style={{ color: "var(--p-text-3)" }}>
                    {t("marketing.brandKit.foundations.color.accentWeakTint", undefined, "Accent-weak tint")}
                  </div>
                  <div className="hx" style={{ color: p.inkText }}>
                    {p.accentText}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="kf-sub">
            {t("marketing.brandKit.foundations.color.semantic", undefined, "Semantic — shared across products")}
            <span className="ln" />
          </div>
          <div className="kf-grid kf-grid-4">
            {[
              {
                name: t("marketing.brandKit.foundations.color.swatch.success", undefined, "Success"),
                token: "--p-success",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.warning", undefined, "Warning"),
                token: "--p-warning",
              },
              {
                name: t("marketing.brandKit.foundations.color.swatch.danger", undefined, "Danger"),
                token: "--p-danger",
              },
              { name: t("marketing.brandKit.foundations.color.swatch.info", undefined, "Info"), token: "--p-info" },
            ].map((s) => (
              <div key={s.token} className="kf-swatch">
                <div className="chip" style={{ background: `var(${s.token})` }} />
                <div className="meta">
                  <div className="nm">{s.name}</div>
                  <div className="hex kf-tok">{s.token}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== TYPE ===== */}
        <section className="kf-sec" id="type">
          <p className="eb">{t("marketing.brandKit.foundations.type.eyebrow", undefined, "Foundations · Type")}</p>
          <h2>{t("marketing.brandKit.foundations.type.heading", undefined, "Typography")}</h2>
          <p className="lead">
            <b>{t("marketing.brandKit.foundations.type.lead.monument", undefined, "Monument.")}</b>{" "}
            {t("marketing.brandKit.foundations.type.lead.s1", undefined, "Headings and metrics are set in")}{" "}
            <b>
              {t("marketing.brandKit.foundations.type.lead.anton", undefined, "Anton, an ultra-condensed all-caps display face")}
            </b>{" "}
            {t(
              "marketing.brandKit.foundations.type.lead.s2",
              undefined,
              "— a single black weight that gives the product poster-scale presence. Body and UI stay",
            )}{" "}
            <b>Hanken Grotesk</b>{" "}
            {t("marketing.brandKit.foundations.type.lead.s3", undefined, "so tables and forms read clean;")}{" "}
            <b>Space Mono</b>{" "}
            {t(
              "marketing.brandKit.foundations.type.lead.s4",
              undefined,
              "is the eyebrow and coordinate vernacular (IDs, codes, labels); and",
            )}{" "}
            <b>Jost</b>{" "}
            {t(
              "marketing.brandKit.foundations.type.lead.s5",
              undefined,
              "is the constructed wordmark lockup only. Display headings are ALL-CAPS (Anton is a caps face); body and labels stay Title / sentence case.",
            )}
          </p>

          <div className="kf-grid kf-grid-4" style={{ marginBottom: 22 }}>
            <div className="kf-board">
              <div className="bb">
                <div
                  style={{
                    fontFamily: "var(--p-heading)",
                    fontStretch: "normal",
                    fontWeight: 400,
                    fontSize: 34,
                    letterSpacing: "0.005em",
                    textTransform: "uppercase",
                    color: "var(--p-text-1)",
                  }}
                >
                  Aa
                </div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Anton
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>
                  {t("marketing.brandKit.foundations.type.face.anton", undefined, "Display · headings · stats")}
                </div>
              </div>
            </div>
            <div className="kf-board">
              <div className="bb">
                <div style={{ fontSize: 30, fontWeight: 700, color: "var(--p-text-1)" }}>Aa</div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Hanken Grotesk
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>
                  {t("marketing.brandKit.foundations.type.face.hanken", undefined, "Body · UI · 400–800")}
                </div>
              </div>
            </div>
            <div className="kf-board">
              <div className="bb">
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--p-text-1)",
                    fontFamily: "var(--p-mono)",
                  }}
                >
                  Aa
                </div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Space Mono
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>
                  {t("marketing.brandKit.foundations.type.face.mono", undefined, "Eyebrows · IDs · codes")}
                </div>
              </div>
            </div>
            <div className="kf-board">
              <div className="bb">
                <div style={{ fontSize: 30, fontWeight: 500, color: "var(--p-text-1)", fontFamily: "var(--p-wordmark)" }}>
                  Aa
                </div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Jost
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>
                  {t("marketing.brandKit.foundations.type.face.jost", undefined, "Wordmark lockup only")}
                </div>
              </div>
            </div>
          </div>

          <div className="kf-board">
            <div className="bb">
              {[
                { lbl: "Display · 44", text: "The Dashboard", size: 44, wide: true, weight: 400, ls: "0.005em" },
                { lbl: "H1 · 34", text: "Production Timeline", size: 34, wide: true, weight: 400, ls: "0.005em" },
                { lbl: "H2 · 26", text: "Active Projects", size: 26, wide: true, weight: 400, ls: "0.005em" },
                {
                  lbl: "H3 · 20",
                  text: "Salvage City Supper Club",
                  size: 20,
                  wide: true,
                  weight: 400,
                  ls: "0.005em",
                },
                {
                  lbl: "Body · 14",
                  text: t(
                    "marketing.brandKit.foundations.type.specimen.body",
                    undefined,
                    "The default reading size for tables, forms, and interface copy.",
                  ),
                  size: 14,
                  wide: false,
                  weight: 400,
                  ls: "0",
                  muted: true,
                },
                {
                  lbl: "Small · 12",
                  text: t(
                    "marketing.brandKit.foundations.type.specimen.small",
                    undefined,
                    "Secondary metadata and helper text.",
                  ),
                  size: 12,
                  wide: false,
                  weight: 400,
                  ls: "0",
                  muted: true,
                },
              ].map((spec) => (
                <div className="kf-typespec" key={spec.lbl}>
                  <span className="lbl">{spec.lbl}</span>
                  <span
                    className="ex"
                    style={{
                      fontSize: spec.size,
                      fontFamily: spec.wide ? "var(--p-heading)" : undefined,
                      fontStretch: spec.wide ? "normal" : undefined,
                      fontWeight: spec.weight,
                      letterSpacing: spec.ls,
                      textTransform: spec.wide ? "uppercase" : undefined,
                      color: spec.muted ? "var(--p-text-2)" : "var(--p-text-1)",
                    }}
                  >
                    {spec.text}
                  </span>
                </div>
              ))}
              <div className="kf-typespec">
                <span className="lbl">Eyebrow · 11</span>
                <span className="ex ps-eyebrow" style={{ fontSize: 11 }}>
                  Workspace / Production
                </span>
              </div>
            </div>
          </div>

          <div className="kf-sub">
            {t("marketing.brandKit.foundations.type.headerTreatments", undefined, "Header treatments")}
            <span className="ln" />
          </div>
          <p className="kf-note">
            {t(
              "marketing.brandKit.foundations.type.headerTreatmentsNote",
              undefined,
              "Three sanctioned ways to deploy the wide headline. Use the right one for the context — don't mix more than one per view.",
            )}
          </p>
          <div className="kf-grid kf-grid-3">
            <div className="kf-board">
              <div className="bh">
                <span className="t">
                  {t("marketing.brandKit.foundations.type.a2.title", undefined, "A2 · Everyday")}
                </span>
                <span className="m">.ps-pagehead</span>
              </div>
              <div className="bb">
                <div className="ps-pagehead">
                  <span className="kick">
                    <span className="ps-livedot" />
                    Workspace / Production
                  </span>
                  <span className="t" style={{ fontSize: 24 }}>
                    The Dashboard
                  </span>
                </div>
                <p className="kf-note" style={{ margin: "14px 0 0" }}>
                  {t(
                    "marketing.brandKit.foundations.type.a2.note",
                    undefined,
                    "Accent bar + live mono kicker. The default for app chrome and page headers.",
                  )}
                </p>
              </div>
            </div>
            <div className="kf-board">
              <div className="bh">
                <span className="t">{t("marketing.brandKit.foundations.type.a3.title", undefined, "A3 · Hero")}</span>
                <span className="m">.ps-hero .pop</span>
              </div>
              <div className="bb">
                <div className="ps-hero" style={{ fontSize: 30 }}>
                  {t("marketing.brandKit.foundations.type.a3.sampleBefore", undefined, "Run the")}{" "}
                  <span className="pop">
                    {t("marketing.brandKit.foundations.type.a3.samplePop", undefined, "show")}
                  </span>
                  .
                </div>
                <p className="kf-note" style={{ margin: "14px 0 0" }}>
                  {t(
                    "marketing.brandKit.foundations.type.a3.note",
                    undefined,
                    "One word takes the product accent — headlines self-brand. Covers, marketing, splash.",
                  )}
                </p>
              </div>
            </div>
            <div className="kf-board">
              <div className="bh">
                <span className="t">
                  {t("marketing.brandKit.foundations.type.a4.title", undefined, "A4 · Metrics")}
                </span>
                <span className="m">.ps-stat .v</span>
              </div>
              <div className="bb">
                <div className="ps-stat" style={{ boxShadow: "none", border: 0, padding: 0 }}>
                  <div className="k">
                    {t("marketing.brandKit.foundations.type.a4.statLabel", undefined, "On-Time Rate")}
                  </div>
                  <div className="v" style={{ fontSize: 44 }}>
                    98%
                  </div>
                  <div className="d">
                    {t("marketing.brandKit.foundations.type.a4.statDelta", undefined, "▲ 2% vs Q3")}
                  </div>
                </div>
                <p className="kf-note" style={{ margin: "10px 0 0" }}>
                  {t(
                    "marketing.brandKit.foundations.type.a4.note",
                    undefined,
                    "Tabular figures at 900 / expanded. Dashboards and reports.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SPACING ===== */}
        <section className="kf-sec" id="spacing">
          <p className="eb">{t("marketing.brandKit.foundations.spacing.eyebrow", undefined, "Foundations · Space")}</p>
          <h2>{t("marketing.brandKit.foundations.spacing.heading", undefined, "Spacing")}</h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.spacing.lead.before",
              undefined,
              "A 4px base grid. Density swaps the control and row rhythm — the same tokens tighten under",
            )}{" "}
            <code className="kf-code">data-density=&quot;compact&quot;</code>.
          </p>
          <div className="kf-board">
            <div className="bb">
              {[
                { token: "--p-1 · 4", width: 4 },
                { token: "--p-2 · 8", width: 8 },
                { token: "--p-3 · 12", width: 12 },
                { token: "--p-4 · 16", width: 16 },
                { token: "--p-5 · 20", width: 20 },
                { token: "--p-6 · 24", width: 24 },
                { token: "--p-8 · 32", width: 32 },
              ].map((s) => (
                <div className="kf-sbar" key={s.token}>
                  <span className="tok">{s.token}</span>
                  <span className="bx" style={{ width: s.width }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== RADII ===== */}
        <section className="kf-sec" id="radii">
          <p className="eb">{t("marketing.brandKit.foundations.radii.eyebrow", undefined, "Foundations · Radius")}</p>
          <h2>{t("marketing.brandKit.foundations.radii.heading", undefined, "Radii")}</h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.radii.lead",
              undefined,
              "Soft, productivity-tool friendly — never pop-art sharp. Pills for chips and toggles only.",
            )}
          </p>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-radii">
                {[
                  { radius: 6, cap: "--p-r-sm · 6" },
                  { radius: 8, cap: "--p-r · 8" },
                  { radius: 12, cap: "--p-r-lg · 12" },
                  { radius: 999, cap: "--p-r-pill" },
                ].map((r) => (
                  <div className="r" key={r.cap}>
                    <div className="bx" style={{ borderRadius: r.radius }} />
                    <div className="cap">{r.cap}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== ELEVATION ===== */}
        <section className="kf-sec" id="elevation">
          <p className="eb">
            {t("marketing.brandKit.foundations.elevation.eyebrow", undefined, "Foundations · Elevation")}
          </p>
          <h2>{t("marketing.brandKit.foundations.elevation.heading", undefined, "Elevation")}</h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.elevation.lead",
              undefined,
              "A cool, tight three-step scale: resting → hover → popover & modal. Shadows are subtle in light and lean on borders in dark.",
            )}
          </p>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-elev">
                <div className="e" style={{ boxShadow: "var(--p-elev-1)" }}>
                  {t("marketing.brandKit.foundations.elevation.rest", undefined, "elev-1 · rest")}
                </div>
                <div className="e" style={{ boxShadow: "var(--p-elev-2)" }}>
                  {t("marketing.brandKit.foundations.elevation.hover", undefined, "elev-2 · hover")}
                </div>
                <div className="e" style={{ boxShadow: "var(--p-elev-3)" }}>
                  {t("marketing.brandKit.foundations.elevation.overlay", undefined, "elev-3 · overlay")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== MOTION ===== */}
        <section className="kf-sec" id="motion">
          <p className="eb">{t("marketing.brandKit.foundations.motion.eyebrow", undefined, "Foundations · Motion")}</p>
          <h2>{t("marketing.brandKit.foundations.motion.heading", undefined, "Motion")}</h2>
          <p className="lead">
            {t(
              "marketing.brandKit.foundations.motion.lead.s1",
              undefined,
              "Quick and unfussy. One easing curve, short durations, and a hard rule: never transition a token-backed",
            )}{" "}
            <code className="kf-code">background</code>{" "}
            {t(
              "marketing.brandKit.foundations.motion.lead.s2",
              undefined,
              "across a theme switch — recolor instantly and animate",
            )}{" "}
            <code className="kf-code">filter</code>{" "}
            {t("marketing.brandKit.foundations.motion.lead.or", undefined, "or")}{" "}
            <code className="kf-code">opacity</code>{" "}
            {t("marketing.brandKit.foundations.motion.lead.instead", undefined, "instead.")}
          </p>
          <table className="kf-spec">
            <thead>
              <tr>
                <th>{t("marketing.brandKit.foundations.motion.col.token", undefined, "Token")}</th>
                <th>{t("marketing.brandKit.foundations.motion.col.value", undefined, "Value")}</th>
                <th>{t("marketing.brandKit.foundations.motion.col.use", undefined, "Use")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>--p-ease</code>
                </td>
                <td>140ms cubic-bezier(.2,.7,.2,1)</td>
                <td>
                  {t("marketing.brandKit.foundations.motion.row.ease", undefined, "Hover, press, micro-interactions")}
                </td>
              </tr>
              <tr>
                <td>{t("marketing.brandKit.foundations.motion.row.hoverLift", undefined, "Hover lift")}</td>
                <td>
                  <b>translateY(-2px)</b> + elev-2
                </td>
                <td>{t("marketing.brandKit.foundations.motion.row.hoverUse", undefined, "Cards, stat tiles")}</td>
              </tr>
              <tr>
                <td>{t("marketing.brandKit.foundations.motion.row.skeleton", undefined, "Skeleton shimmer")}</td>
                <td>
                  {t("marketing.brandKit.foundations.motion.row.skeletonValue", undefined, "1.4s ease, infinite")}
                </td>
                <td>
                  {t(
                    "marketing.brandKit.foundations.motion.row.skeletonUse",
                    undefined,
                    "Loading placeholders (respects reduced-motion)",
                  )}
                </td>
              </tr>
              <tr>
                <td>{t("marketing.brandKit.foundations.motion.row.spinner", undefined, "Spinner")}</td>
                <td>{t("marketing.brandKit.foundations.motion.row.spinnerValue", undefined, "0.7s linear")}</td>
                <td>{t("marketing.brandKit.foundations.motion.row.spinnerUse", undefined, "In-flight actions")}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ===== ICONS ===== */}
        <section className="kf-sec" id="icons">
          <p className="eb">{t("marketing.brandKit.foundations.icons.eyebrow", undefined, "Foundations · Icons")}</p>
          <h2>{t("marketing.brandKit.foundations.icons.heading", undefined, "Iconography")}</h2>
          <p className="lead">
            {t("marketing.brandKit.foundations.icons.lead.before", undefined, "Phosphor Icons —")}{" "}
            <b>{t("marketing.brandKit.foundations.icons.lead.bold", undefined, "Bold")}</b>{" "}
            {t("marketing.brandKit.foundations.icons.lead.mid", undefined, "weight for UI,")}{" "}
            <b>{t("marketing.brandKit.foundations.icons.lead.fill", undefined, "Fill")}</b>{" "}
            {t(
              "marketing.brandKit.foundations.icons.lead.after",
              undefined,
              "for status seals and emphasis. Line up with text at 16–20px; standalone actions at 24px. Single-color, inheriting",
            )}{" "}
            <code className="kf-code">currentColor</code>.
          </p>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-iconwall">
                <span className="cell">
                  <SquaresFour size={26} weight="bold" />
                </span>
                <span className="cell">
                  <Folders size={26} weight="bold" />
                </span>
                <span className="cell">
                  <CalendarBlank size={26} weight="bold" />
                </span>
                <span className="cell">
                  <UsersThree size={26} weight="bold" />
                </span>
                <span className="cell">
                  <ChartBar size={26} weight="bold" />
                </span>
                <span className="cell">
                  <Gear size={26} weight="bold" />
                </span>
                <span className="cell">
                  <Ticket size={26} weight="bold" />
                </span>
                <span className="cell">
                  <IdentificationBadge size={26} weight="bold" />
                </span>
                <span className="cell">
                  <Wallet size={26} weight="bold" />
                </span>
                <span className="cell">
                  <MagnifyingGlass size={26} weight="bold" />
                </span>
                <span className="cell">
                  <Plus size={26} weight="bold" />
                </span>
                <span className="cell">
                  <Funnel size={26} weight="bold" />
                </span>
                <span className="cell">
                  <SealCheck size={26} weight="fill" style={{ color: "var(--p-success)" }} />
                </span>
                <span className="cell">
                  <WarningCircle size={26} weight="fill" style={{ color: "var(--p-warning)" }} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="kf-foot">
          <small>
            {t("marketing.brandKit.foundations.footer.tagline", undefined, "ATLVS Technologies · Foundations")}
          </small>
          <div className="lk">
            <Link href="/brand-kit">{t("marketing.brandKit.foundations.footer.overview", undefined, "Overview")}</Link>
            <Link href="/brand-kit/logo-kit">
              {t("marketing.brandKit.foundations.footer.logoKit", undefined, "Logo Kit")}
            </Link>
            <Link href="/">{t("common.home", undefined, "Home")}</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
