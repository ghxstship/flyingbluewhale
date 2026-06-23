import { headers } from "next/headers";
import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { shellForHost } from "@/lib/urls";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = SITE.baseUrl;

  // App subdomains (app/gvteway/compvss) are auth-walled — disallow all
  // crawling on those hosts; only the apex marketing site is indexable.
  // Resolution goes through shellForHost (the canon subdomain map): the
  // old prefix check `host.startsWith("atlvs.")` matched the APEX
  // `atlvs.pro` itself — telling crawlers to skip the entire marketing
  // site in production — while missing the real console host `app.`.
  const host = (await headers()).get("host") ?? "";
  const { shell } = shellForHost(host);
  const isAppShell = shell === "platform" || shell === "portal" || shell === "mobile";

  if (isAppShell) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: ["/"], disallow: ["/studio", "/api", "/auth", "/m", "/me", "/p"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
