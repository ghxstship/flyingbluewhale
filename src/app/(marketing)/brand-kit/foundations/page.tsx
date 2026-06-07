/**
 * /brand-kit/foundations
 *
 * Faithful Next.js port of design_handoff_atlvs_kit v3 foundations.html.
 * Documents the ATLVS brand mark, color, typography, spacing, radii,
 * elevation, motion, and iconography. Every value resolves from --p-* /
 * --brand-* — no raw hex.
 *
 * The page intentionally uses the kit's documentation primitives (.kf-*
 * page-local helpers) alongside the canonical kit primitives (.ps-*,
 * Wordmark, brand SVG marks) — so consumers see the kit documented by
 * the kit, not by a parallel system.
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
import "./foundations.css";

export const metadata: Metadata = {
  title: "Foundations · ATLVS Technologies — Brand & UI Kit",
  description:
    "ATLVS Technologies brand foundations: Waypoint mark, color, typography (Industrial Wide / Archivo expanded), spacing, radii, elevation, motion, and iconography.",
  alternates: { canonical: "/brand-kit/foundations" },
};

export default function FoundationsPage() {
  return (
    <div className="kf-wrap">
      {/* ===== SECTION NAV ===== */}
      <aside className="kf-nav" aria-label="Foundations sections">
        <div className="gp">Brand</div>
        <a href="#logo">The Waypoint</a>
        <a href="#appicons">App icons</a>
        <a href="#clearspace">Clearspace &amp; usage</a>
        <div className="gp">Foundations</div>
        <a href="#color">Color</a>
        <a href="#type">Typography</a>
        <a href="#spacing">Spacing</a>
        <a href="#radii">Radii</a>
        <a href="#elevation">Elevation</a>
        <a href="#motion">Motion</a>
        <a href="#icons">Iconography</a>
      </aside>

      <main className="kf-main">
        {/* ===== LOGO ===== */}
        <section className="kf-sec" id="logo">
          <p className="eb">Brand · Logo</p>
          <h2>The Waypoint</h2>
          <p className="lead">
            The ATLVS mark is a <b>waypoint</b> — an eight-point navigational star with a center void, the navigation
            system rendered as one geometric glyph. Neutral SaaS register, recolored per product. It is distinct from
            the cosmic GHXSTSHIP ghost-ship skull, which is the parent-company mark only.
          </p>

          <div className="kf-grid kf-grid-2">
            {/* Lockup on white tile (light affordance) */}
            <div className="kf-lockup">
              <span
                className="tile"
                style={{ background: "#FFFFFF", border: "1px solid var(--p-border-2)" }}
                aria-hidden="true"
              >
                <Image src="/brand/atlvs-mark.svg" alt="" width={38} height={38} />
              </span>
              <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 30 }} />
            </div>
            {/* Lockup on ink tile (dark affordance) */}
            <div className="kf-lockup">
              <span
                className="tile"
                style={{ background: "#181B23", border: "1px solid var(--p-border-2)" }}
                aria-hidden="true"
              >
                <Image src="/brand/atlvs-mark-white.svg" alt="" width={38} height={38} />
              </span>
              <Wordmark word="ATLVS" subtitle="TECHNOLOGIES" style={{ fontSize: 30 }} />
            </div>
          </div>
          <p className="kf-note" style={{ marginTop: 14 }}>
            The tile carries the product accent; the star stays white (or ink on light grounds). The wordmark is always
            spaced caps and nowrap — never lowercase, never unspaced except in URLs and IDs.
          </p>

          <table className="kf-spec" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Wordmark spec</th>
                <th>Setting</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Face</b>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--p-wordmark)" }}>Jost</span> — geometric, logo lockup only. UI &amp;
                  headings stay Space Grotesk / Archivo Expanded.
                </td>
              </tr>
              <tr>
                <td>
                  <b>The A</b>
                </td>
                <td>
                  A bare peak — <b>no crossbar</b>, the V flipped. A and V read as mirror forms.
                </td>
              </tr>
              <tr>
                <td>
                  <b>Setting</b>
                </td>
                <td>
                  Spaced caps, nowrap. In the full lockup,{" "}
                  <span className="ps-mono" style={{ fontSize: 11 }}>
                    TECHNOLOGIES
                  </span>{" "}
                  is letter-spaced to the exact ATLVS width.
                </td>
              </tr>
              <tr>
                <td>
                  <b>Subtitle</b>
                </td>
                <td>
                  Only ATLVS carries <b>TECHNOLOGIES</b>. COMPVSS and GVTEWAY stand alone.
                </td>
              </tr>
            </tbody>
          </table>

          <div className="kf-sub" style={{ marginTop: 26 }}>
            Product wordmarks
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
          <h2 style={{ fontSize: 20 }}>One mark, three accents</h2>
          <p className="lead">
            Each product is the same waypoint on its own accent tile — instantly a family, instantly distinct.
          </p>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-row" style={{ gap: 34, justifyContent: "space-between" }}>
                {[
                  { tile: "var(--brand-atlvs)", title: "ATLVS · pink", role: "Producer / Internal" },
                  { tile: "var(--brand-compvss)", title: "COMPVSS · amber", role: "Crew / Vendor / Talent" },
                  { tile: "var(--brand-gvteway)", title: "GVTEWAY · cyan", role: "Guest / Client" },
                  { tile: "var(--p-text-1)", title: "Ink", role: "Neutral / Suite" },
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
                Min-size — the mark holds at every scale
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
                  <div className="cap">16 · bare</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CLEARSPACE / USAGE ===== */}
        <section className="kf-sec" id="clearspace">
          <h2 style={{ fontSize: 20 }}>Clearspace &amp; usage</h2>
          <p className="lead">Keep margin equal to half the mark height on every side.</p>
          <div className="kf-clearbox">
            <div className="inner">
              <Image src="/brand/atlvs-mark.svg" alt="" width={50} height={50} />
              <Wordmark word="ATLVS" style={{ fontSize: 19 }} />
            </div>
          </div>
          <div className="kf-dd" style={{ marginTop: 22 }}>
            <div className="kf-do">
              <div className="h">
                <CheckCircle size={18} weight="bold" /> Do
              </div>
              <ul>
                <li>Recolor the tile to the product accent; keep the star white (or ink on light).</li>
                <li>Maintain clearspace = ½ mark height.</li>
                <li>Use the bare mark at ≤16px; the tiled icon at ≥32px.</li>
                <li>
                  Pair with the spaced <b>A&nbsp;T&nbsp;L&nbsp;V&nbsp;S</b> wordmark, nowrap.
                </li>
              </ul>
            </div>
            <div className="kf-dont">
              <div className="h">
                <XCircle size={18} weight="bold" /> Don&apos;t
              </div>
              <ul>
                <li>Recolor or gradient the star itself — only the tile carries color.</li>
                <li>Rotate, stretch, or add the cosmic halftone or skull.</li>
                <li>Set the wordmark unspaced or lowercase.</li>
                <li>Place the bare mark on a busy photo without the solid tile.</li>
              </ul>
            </div>
          </div>
          <div className="ps-banner ps-banner--info" style={{ marginTop: 18 }}>
            <Info size={18} weight="bold" />
            <div>
              <b>Parent endorsement.</b> The GHXSTSHIP skull appears only in the endorsement lockup — &ldquo;an ATLVS
              Technologies, a GHXSTSHIP Industries company.&rdquo; It is never the product app icon.
            </div>
          </div>
        </section>

        {/* ===== COLOR ===== */}
        <section className="kf-sec" id="color">
          <p className="eb">Foundations · Color</p>
          <h2>Color</h2>
          <p className="lead">
            Neutral surfaces do the work; one accent per product carries identity. Every value resolves from the{" "}
            <code className="kf-code">--p-*</code> namespace and re-tunes per mode for AA contrast.
          </p>

          <div className="kf-sub">
            Surfaces &amp; text
            <span className="ln" />
          </div>
          <div className="kf-grid kf-grid-4">
            {[
              { name: "Canvas", token: "--p-bg" },
              { name: "Surface", token: "--p-surface" },
              { name: "Surface 2", token: "--p-surface-2" },
              { name: "Border", token: "--p-border-2" },
              { name: "Text 1", token: "--p-text-1" },
              { name: "Text 2", token: "--p-text-2" },
              { name: "Text 3", token: "--p-text-3" },
              { name: "Accent (live)", token: "--p-accent" },
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
            Product identity — the accent each app owns
            <span className="ln" />
          </div>
          <div className="kf-col" style={{ gap: 10 }}>
            {[
              {
                name: "ATLVS",
                role: "Producer / Internal",
                hex: "#FF2E88",
                accentBg: "var(--brand-atlvs)",
                accentOn: "var(--brand-atlvs-on)",
                weakBg: "color-mix(in oklab,var(--brand-atlvs) 12%,var(--p-surface))",
                inkText: "var(--brand-atlvs-ink)",
                accentText: "accent-text #D11668 (light) · #FF6FAE (dark)",
              },
              {
                name: "COMPVSS",
                role: "Crew / Vendor / Talent",
                hex: "#E9A23B",
                accentBg: "var(--brand-compvss)",
                accentOn: "var(--brand-compvss-on)",
                weakBg: "color-mix(in oklab,var(--brand-compvss) 14%,var(--p-surface))",
                inkText: "var(--brand-compvss-ink)",
                accentText: "accent-text #9A6512 (light) · #F0B255 (dark)",
              },
              {
                name: "GVTEWAY",
                role: "Guest / Client",
                hex: "#12B5B5",
                accentBg: "var(--brand-gvteway)",
                accentOn: "var(--brand-gvteway-on)",
                weakBg: "color-mix(in oklab,var(--brand-gvteway) 14%,var(--p-surface))",
                inkText: "var(--brand-gvteway-ink)",
                accentText: "accent-text #0B7E7E (light) · #3FE0E0 (dark)",
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
                    Accent-weak tint
                  </div>
                  <div className="hx" style={{ color: p.inkText }}>
                    {p.accentText}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="kf-sub">
            Semantic — shared across products
            <span className="ln" />
          </div>
          <div className="kf-grid kf-grid-4">
            {[
              { name: "Success", token: "--p-success" },
              { name: "Warning", token: "--p-warning" },
              { name: "Danger", token: "--p-danger" },
              { name: "Info", token: "--p-info" },
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
          <p className="eb">Foundations · Type</p>
          <h2>Typography</h2>
          <p className="lead">
            <b>Industrial Wide.</b> Headings and metrics are set in <b>Archivo at its expanded width axis</b> — a
            confident, structural grotesque that gives the product presence. Body and UI stay <b>Space Grotesk</b> so
            tables and forms read clean; <b>Space Mono</b> is the eyebrow and coordinate vernacular (IDs, codes,
            labels); <b>Inter</b> is the long-form body alternate. Title Case for headings and labels; sentence case for
            body.
          </p>

          <div className="kf-grid kf-grid-4" style={{ marginBottom: 22 }}>
            <div className="kf-board">
              <div className="bb">
                <div
                  style={{
                    fontFamily: "var(--p-heading)",
                    fontStretch: "125%",
                    fontWeight: 800,
                    fontSize: 30,
                    color: "var(--p-text-1)",
                  }}
                >
                  Aa
                </div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Archivo Expanded
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>Headings · stats · 700–900</div>
              </div>
            </div>
            <div className="kf-board">
              <div className="bb">
                <div style={{ fontSize: 30, fontWeight: 700, color: "var(--p-text-1)" }}>Aa</div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Space Grotesk
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>Body · UI · 400–700</div>
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
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>Eyebrows · IDs · codes</div>
              </div>
            </div>
            <div className="kf-board">
              <div className="bb">
                <div style={{ fontSize: 30, fontWeight: 600, color: "var(--p-text-1)", fontFamily: "Inter" }}>Aa</div>
                <div className="kf-tok" style={{ marginTop: 8 }}>
                  Inter
                </div>
                <div style={{ fontSize: 12, color: "var(--p-text-3)", marginTop: 4 }}>Long-form body alternate</div>
              </div>
            </div>
          </div>

          <div className="kf-board">
            <div className="bb">
              {[
                { lbl: "Display · 40", text: "Mission Control", size: 40, wide: true, weight: 800, ls: "-0.015em" },
                { lbl: "H1 · 30", text: "Production Timeline", size: 30, wide: true, weight: 800, ls: "-0.015em" },
                { lbl: "H2 · 22", text: "Active Projects", size: 22, wide: true, weight: 800, ls: "-0.015em" },
                {
                  lbl: "H3 · 18",
                  text: "Salvage City Supper Club",
                  size: 18,
                  wide: true,
                  weight: 700,
                  ls: "-0.01em",
                },
                {
                  lbl: "Body · 14",
                  text: "The default reading size for tables, forms, and interface copy.",
                  size: 14,
                  wide: false,
                  weight: 400,
                  ls: "0",
                  muted: true,
                },
                {
                  lbl: "Small · 12",
                  text: "Secondary metadata and helper text.",
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
                      fontStretch: spec.wide ? "125%" : undefined,
                      fontWeight: spec.weight,
                      letterSpacing: spec.ls,
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
            Header treatments
            <span className="ln" />
          </div>
          <p className="kf-note">
            Three sanctioned ways to deploy the wide headline. Use the right one for the context — don&apos;t mix more
            than one per view.
          </p>
          <div className="kf-grid kf-grid-3">
            <div className="kf-board">
              <div className="bh">
                <span className="t">A2 · Everyday</span>
                <span className="m">.ps-pagehead</span>
              </div>
              <div className="bb">
                <div className="ps-pagehead">
                  <span className="kick">
                    <span className="ps-livedot" />
                    Workspace / Production
                  </span>
                  <span className="t" style={{ fontSize: 24 }}>
                    Mission Control
                  </span>
                </div>
                <p className="kf-note" style={{ margin: "14px 0 0" }}>
                  Accent bar + live mono kicker. The default for app chrome and page headers.
                </p>
              </div>
            </div>
            <div className="kf-board">
              <div className="bh">
                <span className="t">A3 · Hero</span>
                <span className="m">.ps-hero .pop</span>
              </div>
              <div className="bb">
                <div className="ps-hero" style={{ fontSize: 30 }}>
                  Run the <span className="pop">show</span>.
                </div>
                <p className="kf-note" style={{ margin: "14px 0 0" }}>
                  One word takes the product accent — headlines self-brand. Covers, marketing, splash.
                </p>
              </div>
            </div>
            <div className="kf-board">
              <div className="bh">
                <span className="t">A4 · Metrics</span>
                <span className="m">.ps-stat .v</span>
              </div>
              <div className="bb">
                <div className="ps-stat" style={{ boxShadow: "none", border: 0, padding: 0 }}>
                  <div className="k">On-Time Rate</div>
                  <div className="v" style={{ fontSize: 44 }}>
                    98%
                  </div>
                  <div className="d">▲ 2% vs Q3</div>
                </div>
                <p className="kf-note" style={{ margin: "10px 0 0" }}>
                  Tabular figures at 900 / expanded. Dashboards and reports.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SPACING ===== */}
        <section className="kf-sec" id="spacing">
          <p className="eb">Foundations · Space</p>
          <h2>Spacing</h2>
          <p className="lead">
            A 4px base grid. Density swaps the control and row rhythm — the same tokens tighten under{" "}
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
          <p className="eb">Foundations · Radius</p>
          <h2>Radii</h2>
          <p className="lead">
            Soft, productivity-tool friendly — never pop-art sharp. Pills for chips and toggles only.
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
          <p className="eb">Foundations · Elevation</p>
          <h2>Elevation</h2>
          <p className="lead">
            A cool, tight three-step scale: resting → hover → popover &amp; modal. Shadows are subtle in light and lean
            on borders in dark.
          </p>
          <div className="kf-board">
            <div className="bb">
              <div className="kf-elev">
                <div className="e" style={{ boxShadow: "var(--p-elev-1)" }}>
                  elev-1 · rest
                </div>
                <div className="e" style={{ boxShadow: "var(--p-elev-2)" }}>
                  elev-2 · hover
                </div>
                <div className="e" style={{ boxShadow: "var(--p-elev-3)" }}>
                  elev-3 · overlay
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== MOTION ===== */}
        <section className="kf-sec" id="motion">
          <p className="eb">Foundations · Motion</p>
          <h2>Motion</h2>
          <p className="lead">
            Quick and unfussy. One easing curve, short durations, and a hard rule: never transition a token-backed{" "}
            <code className="kf-code">background</code> across a theme switch — recolor instantly and animate{" "}
            <code className="kf-code">filter</code> or <code className="kf-code">opacity</code> instead.
          </p>
          <table className="kf-spec">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>--p-ease</code>
                </td>
                <td>140ms cubic-bezier(.2,.7,.2,1)</td>
                <td>Hover, press, micro-interactions</td>
              </tr>
              <tr>
                <td>Hover lift</td>
                <td>
                  <b>translateY(-2px)</b> + elev-2
                </td>
                <td>Cards, stat tiles</td>
              </tr>
              <tr>
                <td>Skeleton shimmer</td>
                <td>1.4s ease, infinite</td>
                <td>Loading placeholders (respects reduced-motion)</td>
              </tr>
              <tr>
                <td>Spinner</td>
                <td>0.7s linear</td>
                <td>In-flight actions</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ===== ICONS ===== */}
        <section className="kf-sec" id="icons">
          <p className="eb">Foundations · Icons</p>
          <h2>Iconography</h2>
          <p className="lead">
            Phosphor Icons — <b>Bold</b> weight for UI, <b>Fill</b> for status seals and emphasis. Line up with text at
            16–20px; standalone actions at 24px. Single-color, inheriting <code className="kf-code">currentColor</code>.
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
          <small>ATLVS Technologies · Foundations</small>
          <div className="lk">
            <Link href="/brand-kit">Overview</Link>
            <Link href="/brand-kit/logo-kit">Logo Kit</Link>
            <Link href="/">Home</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
