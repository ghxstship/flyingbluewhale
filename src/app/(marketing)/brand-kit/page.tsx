/**
 * /brand-kit — ATLVS Technologies brand kit landing page.
 *
 * Renders the full directory of brand surfaces — marketing site, product
 * UI, documents, foundations — as a click-through tile grid. Paint flows
 * through the self-contained --gx-* palette in brand-kit.css (no external
 * theme dependency).
 */
import type { Metadata } from "next";
import Link from "next/link";
import "./brand-kit.css";
import { getRequestT } from "@/lib/i18n/request";
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
  Compass,
  type LucideIcon,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return {
    title: t("marketing.pages.brand-kit.metadata.title"),
    description: t("marketing.pages.brand-kit.metadata.description"),
    alternates: { canonical: "/brand-kit" },
    openGraph: {
      title: t("marketing.pages.brand-kit.metadata.ogTitle"),
      description: t("marketing.pages.brand-kit.metadata.ogDescription"),
      url: "/brand-kit",
    },
  };
}

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

type T = (key: string) => string;

function buildBlocks(t: T): Block[] {
  return [
    {
      eyebrow: t("marketing.pages.brand-kit.blocks.marketing.eyebrow"),
      heading: t("marketing.pages.brand-kit.blocks.marketing.heading"),
      tiles: [
        {
          href: "/",
          icon: Globe,
          title: t("marketing.pages.brand-kit.tiles.homepage.title"),
          body: t("marketing.pages.brand-kit.tiles.homepage.body"),
          meta: t("marketing.pages.brand-kit.tiles.homepage.meta"),
        },
        {
          href: "/solutions/festivals-tours",
          icon: Music,
          title: t("marketing.pages.brand-kit.tiles.festivalProduction.title"),
          body: t("marketing.pages.brand-kit.tiles.festivalProduction.body"),
          meta: t("marketing.pages.brand-kit.tiles.festivalProduction.meta"),
        },
        {
          href: "/solutions/broadcast-tv-film",
          icon: Tv,
          title: t("marketing.pages.brand-kit.tiles.broadcast.title"),
          body: t("marketing.pages.brand-kit.tiles.broadcast.body"),
          meta: t("marketing.pages.brand-kit.tiles.broadcast.meta"),
        },
      ],
    },
    {
      eyebrow: t("marketing.pages.brand-kit.blocks.productUi.eyebrow"),
      heading: t("marketing.pages.brand-kit.blocks.productUi.heading"),
      tiles: [
        {
          href: "/studio",
          icon: LayoutGrid,
          title: t("marketing.pages.brand-kit.tiles.appDashboard.title"),
          body: t("marketing.pages.brand-kit.tiles.appDashboard.body"),
          meta: t("marketing.pages.brand-kit.tiles.appDashboard.meta"),
        },
        {
          href: "/brand-kit",
          icon: AppWindow,
          title: t("marketing.pages.brand-kit.tiles.bridgeKit1.title"),
          body: t("marketing.pages.brand-kit.tiles.bridgeKit1.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: BarChart3,
          title: t("marketing.pages.brand-kit.tiles.bridgeKit2.title"),
          body: t("marketing.pages.brand-kit.tiles.bridgeKit2.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Atom,
          title: t("marketing.pages.brand-kit.tiles.bridgeKit3.title"),
          body: t("marketing.pages.brand-kit.tiles.bridgeKit3.body"),
          state: "preview",
        },
        {
          href: "/atlvs",
          icon: LineChart,
          title: t("marketing.pages.brand-kit.tiles.atlvsGantt.title"),
          body: t("marketing.pages.brand-kit.tiles.atlvsGantt.body"),
        },
        {
          href: "/compvss",
          icon: IdCard,
          title: t("marketing.pages.brand-kit.tiles.compvssCerts.title"),
          body: t("marketing.pages.brand-kit.tiles.compvssCerts.body"),
        },
        {
          href: "/gvteway",
          icon: Ticket,
          title: t("marketing.pages.brand-kit.tiles.gvtewayCheckout.title"),
          body: t("marketing.pages.brand-kit.tiles.gvtewayCheckout.body"),
        },
        {
          href: "/compvss",
          icon: Smartphone,
          title: t("marketing.pages.brand-kit.tiles.mobileUi.title"),
          body: t("marketing.pages.brand-kit.tiles.mobileUi.body"),
          meta: t("marketing.pages.brand-kit.tiles.mobileUi.meta"),
        },
      ],
    },
    {
      eyebrow: t("marketing.pages.brand-kit.blocks.saas.eyebrow"),
      heading: t("marketing.pages.brand-kit.blocks.saas.heading"),
      tiles: [
        {
          href: "/studio",
          icon: AppWindow,
          title: t("marketing.pages.brand-kit.tiles.atlvsProductKit.title"),
          body: t("marketing.pages.brand-kit.tiles.atlvsProductKit.body"),
          meta: t("marketing.pages.brand-kit.tiles.atlvsProductKit.meta"),
        },
        {
          href: "/studio",
          icon: LayoutDashboard,
          title: t("marketing.pages.brand-kit.tiles.saasDashboard.title"),
          body: t("marketing.pages.brand-kit.tiles.saasDashboard.body"),
        },
        {
          href: "/studio",
          icon: Layers,
          title: t("marketing.pages.brand-kit.tiles.saasScreens.title"),
          body: t("marketing.pages.brand-kit.tiles.saasScreens.body"),
        },
      ],
    },
    {
      eyebrow: t("marketing.pages.brand-kit.blocks.collateral.eyebrow"),
      heading: t("marketing.pages.brand-kit.blocks.collateral.heading"),
      tiles: [
        {
          href: "/brand-kit",
          icon: FileText,
          title: t("marketing.pages.brand-kit.tiles.proposalSow.title"),
          body: t("marketing.pages.brand-kit.tiles.proposalSow.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: ListChecks,
          title: t("marketing.pages.brand-kit.tiles.runOfShow.title"),
          body: t("marketing.pages.brand-kit.tiles.runOfShow.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: PieChart,
          title: t("marketing.pages.brand-kit.tiles.postEventRecap.title"),
          body: t("marketing.pages.brand-kit.tiles.postEventRecap.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Mail,
          title: t("marketing.pages.brand-kit.tiles.emailTemplates.title"),
          body: t("marketing.pages.brand-kit.tiles.emailTemplates.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Instagram,
          title: t("marketing.pages.brand-kit.tiles.socialTemplates.title"),
          body: t("marketing.pages.brand-kit.tiles.socialTemplates.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Files,
          title: t("marketing.pages.brand-kit.tiles.stationery.title"),
          body: t("marketing.pages.brand-kit.tiles.stationery.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Presentation,
          title: t("marketing.pages.brand-kit.tiles.pitchDeck.title"),
          body: t("marketing.pages.brand-kit.tiles.pitchDeck.body"),
          state: "preview",
        },
      ],
    },
    {
      eyebrow: t("marketing.pages.brand-kit.blocks.foundations.eyebrow"),
      heading: t("marketing.pages.brand-kit.blocks.foundations.heading"),
      tiles: [
        // The ATLVS Waypoint logo kit — the only reference page in this
        // block that's actually shipped as a live route (the rest are
        // preview placeholders). Sits at the top so it reads as the
        // current canonical reference, not a "coming soon" tile.
        {
          href: "/brand-kit/logo-kit",
          icon: Compass,
          title: t("marketing.pages.brand-kit.tiles.logoKit.title"),
          body: t("marketing.pages.brand-kit.tiles.logoKit.body"),
          meta: t("marketing.pages.brand-kit.tiles.logoKit.meta"),
        },
        {
          href: "/brand-kit",
          icon: BookOpen,
          title: t("marketing.pages.brand-kit.tiles.readme.title"),
          body: t("marketing.pages.brand-kit.tiles.readme.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Network,
          title: t("marketing.pages.brand-kit.tiles.brandArchitecture.title"),
          body: t("marketing.pages.brand-kit.tiles.brandArchitecture.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Palette,
          title: t("marketing.pages.brand-kit.tiles.tokensJson.title"),
          body: t("marketing.pages.brand-kit.tiles.tokensJson.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Handshake,
          title: t("marketing.pages.brand-kit.tiles.handoff.title"),
          body: t("marketing.pages.brand-kit.tiles.handoff.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Search,
          title: t("marketing.pages.brand-kit.tiles.seoGeo.title"),
          body: t("marketing.pages.brand-kit.tiles.seoGeo.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Target,
          title: t("marketing.pages.brand-kit.tiles.proprietaryIp.title"),
          body: t("marketing.pages.brand-kit.tiles.proprietaryIp.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Crosshair,
          title: t("marketing.pages.brand-kit.tiles.competitive.title"),
          body: t("marketing.pages.brand-kit.tiles.competitive.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Layers,
          title: t("marketing.pages.brand-kit.tiles.templatesMap.title"),
          body: t("marketing.pages.brand-kit.tiles.templatesMap.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: Shapes,
          title: t("marketing.pages.brand-kit.tiles.iconography.title"),
          body: t("marketing.pages.brand-kit.tiles.iconography.body"),
          state: "preview",
        },
        {
          href: "/brand-kit",
          icon: ImageIcon,
          title: t("marketing.pages.brand-kit.tiles.photography.title"),
          body: t("marketing.pages.brand-kit.tiles.photography.body"),
          state: "preview",
        },
      ],
    },
  ];
}

function buildChips(t: T): string[] {
  return [
    t("marketing.pages.brand-kit.chips.years"),
    t("marketing.pages.brand-kit.chips.experiences"),
    t("marketing.pages.brand-kit.chips.memories"),
    t("marketing.pages.brand-kit.chips.verticals"),
    t("marketing.pages.brand-kit.chips.destinations"),
  ];
}

export default async function BrandKitPage() {
  const { t } = await getRequestT();
  const blocks = buildBlocks(t);
  const chips = buildChips(t);
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
            <h1 className="bk-h1" aria-label="GHXSTSHIP home">
              G H X S T S H I P
            </h1>
            <p className="bk-tag">Brand &amp; Product System · Venture Beyond</p>
          </div>
        </div>
        <div className={wrap}>
          <p className="bk-def">
            GHXSTSHIP is a full-service experiential production, operations, and technology company headquartered in
            Miami, with offices in New York, Chicago, and Los Angeles. This is the complete brand kit: foundations,
            marketing site, product UI, documents, and handoff. Every tile is live; click to open.
          </p>
          <div className="bk-chips">
            {chips.map((c) => (
              <span key={c} className="bk-chip">
                {c}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        {blocks.map((block) => (
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
