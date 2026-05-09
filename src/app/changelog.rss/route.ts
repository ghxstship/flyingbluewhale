import { CHANGELOG_ENTRIES } from "@/lib/changelog";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 3600; // 1h — changelog rarely changes mid-day

const SITE_NAME = "LYTEHAUS Technologies — Changelog";
const FEED_DESC = "Release notes for LYTEHAUS Technologies — feature launches, reliability, security, and performance.";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc2822(date: string): string {
  // Entry dates are YYYY-MM-DD; RSS wants RFC 822 / RFC 2822 format.
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

export function GET() {
  const base = SITE.baseUrl;
  const feedUrl = `${base}/changelog.rss`;
  const channelUrl = `${base}/changelog`;
  const lastBuild = CHANGELOG_ENTRIES[0]?.date ?? new Date().toISOString().slice(0, 10);

  const items = CHANGELOG_ENTRIES.map((e) => {
    const guid = `${base}/changelog#${e.version}`;
    const link = `${base}/changelog#${e.version}`;
    const itemList = e.items.map((it) => `<li>${escapeXml(it)}</li>`).join("");
    const description = `<![CDATA[<p>${escapeXml(e.body)}</p><ul>${itemList}</ul>]]>`;
    return `    <item>
      <title>${escapeXml(`${e.version} — ${e.title}`)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${rfc2822(e.date)}</pubDate>
      <category>${escapeXml(e.kind)}</category>
      <description>${description}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(channelUrl)}</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${rfc2822(lastBuild)}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
