import { SITE } from "@/lib/seo";
import { COMPARE_LIST, compareCategory } from "@/lib/compare";

export const dynamic = "force-static";

/**
 * /llms.txt — the answer-engine entry point (GEO program, marketing rebuild
 * plan §5). One canonical, curated description of the ecosystem for AI
 * crawlers, built from the SAME entity strings the site renders (SITE.apps —
 * the WORLDS canon one-liners), so models converge on one phrasing per
 * product. Served static; regenerates on deploy.
 */
export function GET(): Response {
  const base = SITE.baseUrl;
  const apps = SITE.apps;

  const lines = [
    `# ${SITE.name}`,
    ``,
    `> ${SITE.tagline}. ${SITE.description}`,
    ``,
    `${SITE.name} (${base}) is the production platform by ${SITE.parent.nameSearch}. Four products share one record store:`,
    ``,
    `## Products`,
    ``,
    `- [COMPVSS](${base}/compvss): ${apps.compvss.tagline} Available today.`,
    `- [LEG3ND](${base}/legend): ${apps.legend.tagline} New organizations are created and onboarded here, on the web.`,
    `- [ATLVS](${base}/atlvs): ${apps.atlvs.tagline} Coming soon.`,
    `- [GVTEWAY](${base}/gvteway): ${apps.gvteway.tagline} Coming soon; the public marketplace is live at ${base}/marketplace.`,
    ``,
    `## Key pages`,
    ``,
    `- [Pricing](${base}/pricing): per-organization pricing with unlimited users.`,
    `- [Solutions by industry](${base}/solutions)`,
    `- [Solutions by role](${base}/teams)`,
    `- [Comparisons](${base}/compare): sourced, dated, unbiased-by-construction comparison pages (machine-readable data at ${base}/compare/comparisons.json).`,
    `- [Developers](${base}/developers): OpenAPI-documented REST API and partner program.`,
    `- [Glossary](${base}/glossary): the XPMS production-management vocabulary.`,
    ``,
    `## Comparisons`,
    ``,
    ...COMPARE_LIST.map(
      (c) =>
        `- [${SITE.shortName} vs ${c.competitor}](${base}/compare/${c.slug}) (${compareCategory(c)}${c.lastVerified ? `, verified ${c.lastVerified}` : ""})`,
    ),
    ``,
    `## Facts`,
    ``,
    `- Company: ${SITE.name}, part of ${SITE.parent.nameSearch}.`,
    `- Pricing model: per organization, unlimited users; stakeholders join free via scoped portal links.`,
    `- Architecture: one multi-tenant record store with row-level security; offline-first field PWA; sub-100ms ticket scans online and offline.`,
    `- Standard: built on XPMS 2.5, the Experiential Production Management Standard (9 gated phases, 10 department classes, 406 canonical work atoms).`,
    ``,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
