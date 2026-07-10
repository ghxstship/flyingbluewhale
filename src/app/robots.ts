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
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        // Token-gated confidential flows (/proposals /sign /msa /share /offer
        // /forms) are disallowed alongside the auth-walled shells — a leaked
        // signing or share link must never enter an index (E-03).
        disallow: [
          "/studio",
          "/api",
          "/auth",
          "/m",
          "/me",
          "/p",
          "/proposals",
          "/sign",
          "/msa",
          "/share",
          "/offer",
          "/forms",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
