/**
 * Live social-graphics endpoint — renders a kit template to a PNG.
 *
 *   GET /social/<template>?format=<fmt>&product=<p>&title=...&...
 *
 * Mirrors the existing OG route (`src/app/og/route.tsx`): a Node-runtime
 * route handler that hands a satori-compatible JSX tree to `next/og`'s
 * `ImageResponse`. This makes the kit live + verifiable in a browser.
 *
 *   templates: announcement · quote · stat · event · launch
 *   formats:   og (1200×630) · square (1080×1080) · story (1080×1920) · wide (1500×500)
 *
 * Examples:
 *   /social/announcement?title=We%20shipped%20it&subtitle=Reports%20v6.3%20is%20live
 *   /social/launch?product=gvteway&format=square&title=Marketplace%20is%20open
 *   /social/stat?format=story&title=Tickets%20sold&value=12%2C480&label=MMW26
 *   /social/event?product=legend&title=The%20Standard&date=Jun%2028&venue=Hialeah
 *   /social/quote?title=Production%20runs%20on%20it&attribution=A%20producer
 *
 * It is an IMAGE ASSET endpoint, intentionally not in any nav. Route handlers
 * outside `/api` are invisible to the sitemap orphan guard, but the path is
 * also listed in scripts/generate-sitemap.mjs#EXEMPT for documentation.
 */
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import type { ProductAccentKey } from "@/lib/brand";
import { formatSize, isSocialFormat, type SocialFormat } from "@/components/social/formats";
import {
  announcementCard,
  quoteCard,
  statCard,
  eventCard,
  launchCard,
  isSocialTemplateId,
} from "@/components/social/templates";

// Node runtime — matches og/route.tsx; keeps ISR/caching eligibility.

const PRODUCTS = new Set<string>(["atlvs", "compvss", "gvteway", "legend", "house"]);

function resolveProduct(raw: string | null): ProductAccentKey | "house" | undefined {
  if (raw && PRODUCTS.has(raw)) return raw as ProductAccentKey | "house";
  return undefined;
}

export async function GET(req: Request, ctx: { params: Promise<{ template: string }> }) {
  const { template } = await ctx.params;
  const { searchParams } = new URL(req.url);

  const formatRaw = searchParams.get("format") ?? "og";
  const format: SocialFormat = isSocialFormat(formatRaw) ? formatRaw : "og";
  const { w, h } = formatSize(format);

  const product = resolveProduct(searchParams.get("product"));
  const title = searchParams.get("title") ?? "ATLVS Technologies";
  const subtitle = searchParams.get("subtitle") ?? undefined;
  const eyebrow = searchParams.get("eyebrow") ?? undefined;
  const footer = searchParams.get("footer") ?? undefined;

  const base = { format, product, title, subtitle, eyebrow, footer };

  let element: ReactElement;
  switch (template) {
    case "quote":
      element = quoteCard({ ...base, attribution: searchParams.get("attribution") ?? undefined });
      break;
    case "stat":
      element = statCard({
        ...base,
        value: searchParams.get("value") ?? title,
        label: searchParams.get("label") ?? subtitle,
      });
      break;
    case "event":
      element = eventCard({
        ...base,
        date: searchParams.get("date") ?? undefined,
        venue: searchParams.get("venue") ?? undefined,
      });
      break;
    case "launch":
      element = launchCard(base);
      break;
    case "announcement":
    default:
      // Unknown ids fall through to the safe default rather than 404 —
      // guarded so `isSocialTemplateId` stays the single source of valid ids.
      element = announcementCard(base);
      break;
  }

  if (!isSocialTemplateId(template) && template !== "announcement") {
    // Keep the default render but signal the fallback in the response header.
    return new ImageResponse(element, {
      width: w,
      height: h,
      headers: { "x-social-template-fallback": template },
    });
  }

  return new ImageResponse(element, { width: w, height: h });
}
