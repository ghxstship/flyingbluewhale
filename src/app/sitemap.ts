import type { MetadataRoute } from "next";
import { POST_LIST } from "@/lib/blog";
import { COMMUNITY_LIST } from "@/lib/community";
import { COMPARE_LIST } from "@/lib/compare";
import { MARKETING_GUIDE_LIST } from "@/lib/marketing-guides";
import { GLOSSARY } from "@/lib/marketing/glossary";
import { TEMPLATES } from "@/lib/marketing/templates";
import { DEMO_PERSONAS } from "@/lib/marketing/demo-personas";
import { SITE } from "@/lib/seo";

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

const SOLUTION_APPS = ["atlvs", "gvteway", "compvss"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.baseUrl;
  const now = new Date();

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  }> = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
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
    { path: "/community", priority: 0.85, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/guides", priority: 0.85, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
    { path: "/changelog", priority: 0.75, changeFrequency: "weekly" },
    { path: "/docs", priority: 0.6, changeFrequency: "weekly" },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/dpa", priority: 0.3, changeFrequency: "yearly" },
    { path: "/legal/sla", priority: 0.3, changeFrequency: "yearly" },
  ];

  const dynamicRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  }> = [
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
    ...MARKETING_GUIDE_LIST.map((g) => ({
      path: `/guides/${g.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes].map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
