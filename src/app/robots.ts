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

  // Token-gated confidential flows (/proposals /sign /msa /share /offer
  // /forms) are disallowed alongside the auth-walled shells — a leaked
  // signing or share link must never enter an index (E-03).
  const CONFIDENTIAL = [
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
  ];

  // GEO: AI crawlers and assistant user-agents are explicitly welcome on the
  // marketing surface (llms.txt + /compare/comparisons.json exist for them),
  // under the same confidential-path boundaries as everyone else. Named so a
  // future catch-all tightening can't silently drop them.
  const AI_CRAWLERS = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "PerplexityBot",
    "Perplexity-User",
    "Google-Extended",
    "Applebot-Extended",
    "cohere-ai",
    "meta-externalagent",
  ];

  return {
    rules: [
      { userAgent: "*", allow: ["/"], disallow: CONFIDENTIAL },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: ["/"], disallow: CONFIDENTIAL })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
