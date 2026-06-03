/**
 * /brand-kit — GHXSTSHIP "Venture Beyond" brand kit landing page.
 *
 * Port of project/index.html from the Claude Design handoff bundle
 * (KVxwO8Y-L8U53KxCtGaAdw). Renders the full directory of brand
 * surfaces — marketing site, product UI, documents, foundations —
 * as a click-through tile grid. Tokens come from the ghxstship
 * theme (src/app/theme/themes/ghxstship.css) so the page paints
 * in-canon on the default theme and lights up correctly on the
 * Bermuda-light / other CHROMA worlds too.
 */
import type { Metadata } from "next";
import Link from "next/link";
import "./brand-kit.css";
import {
  Globe,
  Music,
  Tv,
  LayoutGrid,
  LayoutDashboard,
  BarChart3,
  Atom,
  LineChart,
  IdCard,
  Ticket,
  Smartphone,
  AppWindow,
  Layers,
  FileText,
  ListChecks,
  PieChart,
  Mail,
  Instagram,
  Files,
  Presentation,
  BookOpen,
  Network,
  Palette,
  Handshake,
  Search,
  Target,
  Crosshair,
  Shapes,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Brand Kit · The Venture Beyond System",
  description:
    "GHXSTSHIP design system — foundations, marketing site, product UI, documents, and handoff. The complete kit. Every tile is live; click to open.",
  alternates: { canonical: "/brand-kit" },
  openGraph: {
    title: "G H X S T S H I P · Brand Kit",
    description:
      "Retro-futurist nautical pop art system. Cosmic ink ground, brass doubloon accent, nebula + plasma signals.",
    url: "/brand-kit",
  },
};

// Reach into the ghxstship token vocabulary directly. The kit page
// is the one place we *want* to paint with the named --gx-* palette
// instead of the semantic accent layer — it's literally documenting
// that palette, not consuming it.
const wrap = "mx-auto w-full max-w-[1180px] px-8";

type Tile = {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
  meta?: string;
  /** "preview" → card is a placeholder for a surface that isn't built
   *  in this codebase yet. Renders with a "PREVIEW" chip and routes
   *  back to /brand-kit. */
  state?: "preview";
};

type Block = { eyebrow: string; heading: string; tiles: Tile[] };

const BLOCKS: Block[] = [
  {
    eyebrow: "Marketing Site",
    heading: "The Spaceport",
    tiles: [
      {
        href: "/",
        icon: Globe,
        title: "Homepage",
        body: "Full marketing site — booking-sequence IA, departures ticker, 8-phase strip-map, hero-mode toggle.",
        meta: "/ — public",
      },
      {
        href: "/solutions/festivals-tours",
        icon: Music,
        title: "Festival Production",
        body: "Per-vertical SEO/GEO landing page model.",
        meta: "+5 more verticals",
      },
      {
        href: "/solutions/broadcast-tv-film",
        icon: Tv,
        title: "TV, Film & Broadcast",
        body: "Vertical landing page — Service + FAQ + Breadcrumb schema.",
        meta: "/solutions/",
      },
    ],
  },
  {
    eyebrow: "Product UI · ATLVS · COMPVSS · GVTEWAY",
    heading: "The Instruments",
    tiles: [
      {
        href: "/console",
        icon: LayoutGrid,
        title: "App Dashboard",
        body: "Switchable shell across all three instruments.",
        meta: "/console",
      },
      {
        href: "/brand-kit",
        icon: AppWindow,
        title: "Bridge Kit I",
        body: "Buttons, forms, tables, modals, command palette, auth, 404.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: BarChart3,
        title: "Bridge Kit II",
        body: "Charts, mobile, notifications, detail, chat, prose, signature.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Atom,
        title: "Bridge Kit III",
        body: "Atomic gaps — tooltip, slider, calendar, gallery, funnel, heatmap.",
        state: "preview",
      },
      {
        href: "/solutions/atlvs",
        icon: LineChart,
        title: "ATLVS · Gantt",
        body: "Production timeline, 8-phase columns.",
      },
      {
        href: "/solutions/compvss",
        icon: IdCard,
        title: "COMPVSS · Certs",
        body: "Crew compliance & expiry.",
      },
      {
        href: "/solutions/gvteway",
        icon: Ticket,
        title: "GVTEWAY · Checkout",
        body: "Fan ticketing + boarding-pass QR.",
      },
      {
        href: "/solutions/compvss",
        icon: Smartphone,
        title: "Mobile UI",
        body: "Phone screens — board, detail, wallet, sheet, auth.",
        meta: "compvss field PWA",
      },
    ],
  },
  {
    eyebrow: "ATLVS Technologies · SaaS Product Kit",
    heading: "The Product System",
    tiles: [
      {
        href: "/console",
        icon: AppWindow,
        title: "ATLVS Product Kit",
        body: "Neutral light/dark SaaS theme — dashboard, screens, per-product accent. Distinct from the cosmic brand.",
        meta: "/console",
      },
      {
        href: "/console",
        icon: LayoutDashboard,
        title: "SaaS Dashboard",
        body: "Light/dark + ATLVS/COMPVSS/GVTEWAY accent toggle.",
      },
      {
        href: "/console",
        icon: Layers,
        title: "SaaS Screens",
        body: "Gantt, certifications, checkout — skinned.",
      },
    ],
  },
  {
    eyebrow: "Documents · Email · Social",
    heading: "Collateral",
    tiles: [
      {
        href: "/brand-kit",
        icon: FileText,
        title: "Proposal / SOW",
        body: "Contract-grade: manifest, schedule, manning, systems, investment.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: ListChecks,
        title: "Run of Show",
        body: "Live cue sheet, department-coded.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: PieChart,
        title: "Post-Event Recap",
        body: "Results, gallery, delivered checklist.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Mail,
        title: "Email Templates",
        body: "Brand + ATLVS/COMPVSS/GVTEWAY notifications.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Instagram,
        title: "Social Templates",
        body: "Instagram + LinkedIn.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Files,
        title: "Stationery",
        body: "Business card, letterhead, signature, invoice.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Presentation,
        title: "Pitch Deck",
        body: "9 slide types on the system.",
        state: "preview",
      },
    ],
  },
  {
    eyebrow: "Foundations & Handoff",
    heading: "The Docs",
    tiles: [
      {
        href: "/brand-kit",
        icon: BookOpen,
        title: "README",
        body: "Brand brain — voice, visual foundations, index.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Network,
        title: "Brand Architecture",
        body: "3 verticals, the metaphor, surface register, locks.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Palette,
        title: "tokens.json",
        body: "Machine-readable design tokens for engineering.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Handshake,
        title: "Handoff",
        body: "Claude Code brief — file map, rules, build order.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Search,
        title: "SEO / GEO",
        body: "Playbook + per-vertical page template.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Target,
        title: "Proprietary IP",
        body: "8-Phase Lifecycle locked; XPMS pending input.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Crosshair,
        title: "Competitive",
        body: "Positioning vs. industry leaders.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Layers,
        title: "Templates Map",
        body: "Lifecycle collateral + UI inventory roadmap.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: Shapes,
        title: "Iconography",
        body: "Phosphor system + skull glyph rules.",
        state: "preview",
      },
      {
        href: "/brand-kit",
        icon: ImageIcon,
        title: "Photography",
        body: "Duotone / grade treatment guidelines.",
        state: "preview",
      },
    ],
  },
];

const CHIPS = ["14+ Years", "250+ Experiences", "5M+ Memories", "3 Verticals", "10 Destinations"];

export default function BrandKitPage() {
  return (
    <div className="bk-root">
      <header className="bk-hero">
        <div className={`${wrap} bk-hero-in`}>
          <div className="bk-mark" aria-hidden="true">
            {/* The pixel skull is centered inside the brass-ringed ink lozenge */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/skull-bone.svg" alt="" />
          </div>
          <div>
            <h1 className="bk-h1" aria-label="GHXSTSHIP — home">
              G H X S T S H I P
            </h1>
            <p className="bk-tag">Brand &amp; Product System · Venture Beyond</p>
          </div>
        </div>
        <div className={wrap}>
          <p className="bk-def">
            GHXSTSHIP is a full-service experiential production, operations, and technology company headquartered in
            Miami, with offices in New York, Chicago, and Los Angeles. This is the complete brand kit — foundations,
            marketing site, product UI, documents, and handoff. Every tile is live; click to open.
          </p>
          <div className="bk-chips">
            {CHIPS.map((c) => (
              <span key={c} className="bk-chip">
                {c}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        {BLOCKS.map((block) => (
          <section key={block.heading} className="bk-section">
            <div className={wrap}>
              <p className="bk-eyebrow">{block.eyebrow}</p>
              <h2 className="bk-h2">{block.heading}</h2>
              <div className="bk-grid">
                {block.tiles.map((tile) => (
                  <TileCard key={`${block.heading}-${tile.title}`} tile={tile} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>

      <p className="bk-foot">
        G H X S T S H I P Industries LLC · Miami Headquarters · New York · Chicago · Los Angeles · Venture Beyond
      </p>
    </div>
  );
}

function TileCard({ tile }: { tile: Tile }) {
  const { href, icon: Icon, title, body, meta, state } = tile;
  const isPreview = state === "preview";
  return (
    <Link href={href} className={`bk-card${isPreview ? "bk-card--preview" : ""}`} prefetch={false}>
      <Icon className="bk-card-ic" aria-hidden="true" strokeWidth={2} />
      <h3 className="bk-card-title">{title}</h3>
      <p className="bk-card-body">{body}</p>
      <div className="bk-card-foot">
        {meta ? <span className="bk-card-meta">{meta}</span> : <span aria-hidden="true" />}
        {isPreview ? <span className="bk-card-pill">Preview</span> : null}
      </div>
    </Link>
  );
}
