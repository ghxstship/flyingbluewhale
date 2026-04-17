import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes = [
    "", "/pricing", "/features", "/customers", "/blog",
    "/solutions/live-events", "/solutions/fabrication", "/solutions/touring", "/solutions/corporate",
    "/about", "/contact", "/changelog", "/docs",
    "/legal/terms", "/legal/privacy", "/legal/dpa", "/legal/sla",
  ];
  const now = new Date();
  return routes.map((r) => ({ url: `${base}${r}`, lastModified: now, changeFrequency: "weekly", priority: r === "" ? 1 : 0.6 }));
}
