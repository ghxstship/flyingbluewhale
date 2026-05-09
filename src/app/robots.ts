import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = SITE.baseUrl;

  // App subdomains (atlvs/gvteway/compvss) are auth-walled — disallow all
  // crawling on those hosts, allow only the apex marketing site.
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase() ?? "";
  const isAppSubdomain = host.startsWith("atlvs.") || host.startsWith("gvteway.") || host.startsWith("compvss.");

  if (isAppSubdomain) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: ["/"], disallow: ["/console", "/api", "/auth", "/m", "/me", "/p"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
