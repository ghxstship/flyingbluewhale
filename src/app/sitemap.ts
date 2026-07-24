import type { MetadataRoute } from "next";
import { createServerClient } from "@supabase/ssr";
import { POST_LIST } from "@/lib/blog";
import { COMMUNITY_LIST } from "@/lib/community";
import { COMPARE_LIST } from "@/lib/compare";
import { MARKETING_GUIDE_LIST } from "@/lib/marketing-guides";
import { GLOSSARY } from "@/lib/marketing/glossary";
import { TEMPLATES } from "@/lib/marketing/templates";
import { DEMO_PERSONAS } from "@/lib/marketing/demo-personas";
import { AI_USES } from "@/lib/marketing/ai-uses";
import { TEAMS } from "@/lib/marketing/teams";
import { INTEGRATIONS } from "@/lib/marketing/integrations";
import { SITE } from "@/lib/seo";
import { env, hasSupabase } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

const FEATURE_SLUGS = [
  "console",
  "portals",
  "mobile",
  "ai",
  "finance",
  "procurement",
  "production",
  "compliance",
  "proposals",
  "guides",
  "ticketing",
  "advancing",
  "procore-parity",
  "inspections",
  "schedule",
  "photos",
  "logistics",
  "safety",
  "knowledge",
  "forms",
];

const INDUSTRY_SLUGS = [
  "live-events",
  "concerts",
  "festivals-tours",
  "immersive-experiences",
  "brand-activations",
  "corporate-events",
  "theatrical-performances",
  "broadcast-tv-film",
];

const SOLUTION_APPS = ["atlvs", "gvteway", "compvss", "legend"];

/**
 * The four apex product pages ((marketing)/<brand>). Top of the product
 * funnel — every brand slug has one since the 2026-07-24 LEG3ND shell
 * normalization gave /legend back to the marketing shell.
 */
const PRODUCT_PAGES = ["/atlvs", "/compvss", "/gvteway", "/legend"];

const MARKETPLACE_SECTIONS = ["rfqs", "gigs", "calls", "talent", "crew", "vendors", "agencies"];

type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
};

/** Per-view cap so a runaway directory can't bloat the sitemap or the query. */
const MARKETPLACE_DETAIL_LIMIT = 1000;

/**
 * Marketplace detail URLs, sourced from the anon-readable `public_*`
 * discovery views (same rows the detail pages render). The sitemap runs
 * server-side outside a user session, so this uses a cookie-less anon
 * client — mirroring `createServiceClient` in `src/lib/supabase/server.ts`
 * but with the anon key, since the views are granted to `anon`.
 */
async function marketplaceDetailRoutes(): Promise<SitemapEntry[]> {
  if (!hasSupabase) return [];
  try {
    const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
    const [talent, crew, vendors, agencies, gigs, calls, rfqs] = await Promise.all([
      supabase.from("public_talent_directory").select("public_handle").limit(MARKETPLACE_DETAIL_LIMIT),
      supabase.from("public_crew_directory").select("public_handle").limit(MARKETPLACE_DETAIL_LIMIT),
      supabase.from("public_vendor_directory").select("public_handle").limit(MARKETPLACE_DETAIL_LIMIT),
      supabase.from("public_agency_directory").select("public_handle").limit(MARKETPLACE_DETAIL_LIMIT),
      supabase.from("public_job_board").select("public_slug").limit(MARKETPLACE_DETAIL_LIMIT),
      supabase.from("public_open_calls").select("public_slug").limit(MARKETPLACE_DETAIL_LIMIT),
      supabase.from("public_rfq_marketplace").select("public_slug").limit(MARKETPLACE_DETAIL_LIMIT),
    ]);

    const handles = (rows: { public_handle: string | null }[] | null) =>
      (rows ?? []).map((r) => r.public_handle).filter((h): h is string => Boolean(h));
    const slugs = (rows: { public_slug: string | null }[] | null) =>
      (rows ?? []).map((r) => r.public_slug).filter((s): s is string => Boolean(s));

    return [
      ...handles(talent.data).map((h) => ({
        path: `/marketplace/talent/${h}`,
        priority: 0.7,
        changeFrequency: "weekly" as const,
      })),
      ...handles(crew.data).map((h) => ({
        path: `/marketplace/crew/${h}`,
        priority: 0.7,
        changeFrequency: "weekly" as const,
      })),
      ...handles(vendors.data).map((h) => ({
        path: `/marketplace/vendors/${h}`,
        priority: 0.7,
        changeFrequency: "weekly" as const,
      })),
      ...handles(agencies.data).map((h) => ({
        path: `/marketplace/agencies/${h}`,
        priority: 0.7,
        changeFrequency: "weekly" as const,
      })),
      // Postings expire — crawl them more aggressively while they're live.
      ...slugs(gigs.data).map((s) => ({
        path: `/marketplace/gigs/${s}`,
        priority: 0.65,
        changeFrequency: "daily" as const,
      })),
      ...slugs(calls.data).map((s) => ({
        path: `/marketplace/calls/${s}`,
        priority: 0.65,
        changeFrequency: "daily" as const,
      })),
      ...slugs(rfqs.data).map((s) => ({
        path: `/marketplace/rfqs/${s}`,
        priority: 0.65,
        changeFrequency: "daily" as const,
      })),
    ];
  } catch {
    // A sitemap with only the static routes beats a 500 — swallow and move on.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.baseUrl;
  const now = new Date();

  const staticRoutes: SitemapEntry[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    ...PRODUCT_PAGES.map(
      (path): SitemapEntry => ({ path, priority: 0.9, changeFrequency: "monthly" }),
    ),
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    { path: "/solutions", priority: 0.9, changeFrequency: "monthly" },
    { path: "/features", priority: 0.8, changeFrequency: "monthly" },
    { path: "/compare", priority: 0.85, changeFrequency: "monthly" },
    { path: "/alternatives", priority: 0.85, changeFrequency: "monthly" },
    { path: "/glossary", priority: 0.85, changeFrequency: "monthly" },
    { path: "/templates", priority: 0.85, changeFrequency: "monthly" },
    { path: "/tools", priority: 0.85, changeFrequency: "monthly" },
    { path: "/tools/per-diem-calculator", priority: 0.75, changeFrequency: "monthly" },
    { path: "/tools/capacity-calculator", priority: 0.75, changeFrequency: "monthly" },
    { path: "/demo", priority: 0.85, changeFrequency: "monthly" },
    { path: "/ai", priority: 0.9, changeFrequency: "monthly" },
    { path: "/teams", priority: 0.85, changeFrequency: "monthly" },
    { path: "/integrations", priority: 0.85, changeFrequency: "monthly" },
    { path: "/es-ES", priority: 0.8, changeFrequency: "monthly" },
    { path: "/pt-BR", priority: 0.8, changeFrequency: "monthly" },
    { path: "/roadmap", priority: 0.7, changeFrequency: "weekly" },
    { path: "/status", priority: 0.6, changeFrequency: "daily" },
    { path: "/press", priority: 0.6, changeFrequency: "monthly" },
    { path: "/partners", priority: 0.7, changeFrequency: "monthly" },
    { path: "/community", priority: 0.85, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides", priority: 0.85, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
    { path: "/changelog", priority: 0.75, changeFrequency: "weekly" },
    { path: "/docs", priority: 0.6, changeFrequency: "weekly" },
    { path: "/marketplace", priority: 0.85, changeFrequency: "daily" },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/dpa", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/sla", priority: 0.3, changeFrequency: "yearly" },
  ];

  const dynamicRoutes: SitemapEntry[] = [
    ...MARKETPLACE_SECTIONS.map((s) => ({
      path: `/marketplace/${s}`,
      priority: 0.8,
      changeFrequency: "daily" as const,
    })),
    ...SOLUTION_APPS.map((s) => ({ path: `/solutions/${s}`, priority: 0.9, changeFrequency: "monthly" as const })),
    ...INDUSTRY_SLUGS.map((s) => ({ path: `/solutions/${s}`, priority: 0.85, changeFrequency: "monthly" as const })),
    ...FEATURE_SLUGS.map((s) => ({ path: `/features/${s}`, priority: 0.8, changeFrequency: "monthly" as const })),
    // Programmatic {feature × industry} farm — 20 × 8 = 160 pages.
    ...FEATURE_SLUGS.flatMap((f) =>
      INDUSTRY_SLUGS.map((i) => ({
        path: `/features/${f}/${i}`,
        priority: 0.65,
        changeFrequency: "monthly" as const,
      })),
    ),
    ...POST_LIST.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.7, changeFrequency: "monthly" as const })),
    ...COMMUNITY_LIST.map((c) => ({
      path: `/community/${c.slug}`,
      priority: 0.75,
      changeFrequency: "monthly" as const,
    })),
    ...COMPARE_LIST.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.85, changeFrequency: "monthly" as const })),
    ...COMPARE_LIST.map((c) => ({
      path: `/alternatives/${c.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...GLOSSARY.map((g) => ({
      path: `/glossary/${g.slug}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
    ...TEMPLATES.map((t) => ({
      path: `/templates/${t.slug}`,
      priority: 0.75,
      changeFrequency: "monthly" as const,
    })),
    ...DEMO_PERSONAS.map((p) => ({
      path: `/demo/${p.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...AI_USES.map((u) => ({
      path: `/ai/${u.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...TEAMS.map((t) => ({
      path: `/teams/${t.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...INTEGRATIONS.map((i) => ({
      path: `/integrations/${i.slug}`,
      priority: 0.75,
      changeFrequency: "monthly" as const,
    })),
    ...MARKETING_GUIDE_LIST.map((g) => ({
      path: `/guides/${g.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
  ];

  const marketplaceRoutes = await marketplaceDetailRoutes();

  return [...staticRoutes, ...dynamicRoutes, ...marketplaceRoutes].map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
