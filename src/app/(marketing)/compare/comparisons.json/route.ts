import { COMPARE_LIST, compareCategory } from "@/lib/compare";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * /compare/comparisons.json — the machine-readable comparison dataset (GEO
 * program, marketing rebuild plan §5). Agents and aggregators ingest the
 * structured matrices instead of scraping prose. Deliberately NOT under
 * /api/v1 (that namespace is the authenticated, OpenAPI-contracted product
 * API); this is public marketing data on the marketing origin.
 */
export function GET(): Response {
  const body = {
    generator: SITE.name,
    baseUrl: SITE.baseUrl,
    method:
      "Feature cells assert only what the competitor's linked public pages state; unknowns are 'Not published'. lastVerified is the date claims were last checked; corrections via the site contact page.",
    comparisons: COMPARE_LIST.map((c) => ({
      slug: c.slug,
      competitor: c.competitor,
      category: compareCategory(c),
      url: `${SITE.baseUrl}/compare/${c.slug}`,
      lastVerified: c.lastVerified ?? null,
      sources: c.sources ?? [],
      bottomLine: c.bottomLine,
      features: c.features,
      whenTheyWin: c.whenTheyWin,
    })),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
