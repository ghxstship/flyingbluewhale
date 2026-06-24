/**
 * Social-graphics kit — barrel.
 *
 * A reusable set of brand-locked share-image components designed to render
 * via `next/og` `ImageResponse` (satori), the repo's canonical way of making
 * share images (see `src/app/og/route.tsx` + `src/app/opengraph-image.tsx`).
 *
 * Entry points:
 *   - SOCIAL_FORMATS / formatSize — output dimensions (og/square/story/wide).
 *   - SocialCard + PALETTE        — the parametric card + literal-hex SSOT.
 *   - templates.*                 — preset compositions (announcement/quote/
 *                                   stat/event/launch).
 *
 * See ./README.md for usage + the live route example at /social/[template].
 */
export {
  SOCIAL_FORMATS,
  SOCIAL_FORMAT_IDS,
  formatSize,
  isSocialFormat,
  type SocialFormat,
} from "./formats";

export {
  SocialCard,
  PALETTE,
  resolveAccent,
  type SocialCardProps,
} from "./SocialCard";

export {
  announcementCard,
  quoteCard,
  statCard,
  eventCard,
  launchCard,
  isSocialTemplateId,
  SOCIAL_TEMPLATE_IDS,
  type SocialTemplateId,
} from "./templates";
