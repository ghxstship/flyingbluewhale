/**
 * Social-graphics output formats.
 *
 * The canonical pixel dimensions every share image in the kit renders at.
 * Consumed by `SocialCard` (layout math scales off the format) and by the
 * `next/og` `ImageResponse({ width, height })` call site.
 *
 * Why these four:
 *   - `og`     1200×630 — the OpenGraph / Twitter-summary-large standard
 *              (X, Slack, iMessage, LinkedIn, Discord link unfurls).
 *   - `square` 1080×1080 — Instagram / LinkedIn feed posts.
 *   - `story`  1080×1920 — Instagram / TikTok / Snap vertical stories (9:16).
 *   - `wide`   1500×500 — X/LinkedIn profile-header banner.
 */
export const SOCIAL_FORMATS = {
  og: { w: 1200, h: 630 },
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
  wide: { w: 1500, h: 500 },
} as const;

export type SocialFormat = keyof typeof SOCIAL_FORMATS;

/** The four format ids as a runtime tuple (route param validation, enumeration). */
export const SOCIAL_FORMAT_IDS = Object.keys(SOCIAL_FORMATS) as SocialFormat[];

/** Narrowing guard for untrusted input (query params, route segments). */
export function isSocialFormat(value: string): value is SocialFormat {
  return value in SOCIAL_FORMATS;
}

/** Resolve `{ w, h }` for a format, falling back to `og` on bad input. */
export function formatSize(format: string): { w: number; h: number } {
  return isSocialFormat(format) ? SOCIAL_FORMATS[format] : SOCIAL_FORMATS.og;
}
