/**
 * templates.tsx — preset SocialCard compositions.
 *
 * Each factory takes a small typed `opts` bag and returns a configured
 * `SocialCard` JSX element ready to hand to `ImageResponse`. They encode the
 * voice + layout decisions per use case so call sites stay one-liners:
 *
 *     ImageResponse(announcementCard({ format: "og", title: "..." }), { width, height })
 *
 * Voice (docs/brand/voice.md): world-builder — "you're not running an event,
 * you're building a world." Wonder in the invitations, calm in the chrome.
 *
 * All rendering rules from SocialCard apply (next/og / satori — literal hex,
 * inline style, explicit display on multi-child nodes).
 */
import type { ReactElement } from "react";
import type { ProductAccentKey } from "@/lib/brand";
import { PALETTE, SocialCard, resolveAccent } from "./SocialCard";
import type { SocialFormat } from "./formats";

/** Shared option surface across templates. */
interface BaseTemplateOpts {
  format: SocialFormat;
  product?: ProductAccentKey | "house";
  title: string;
  subtitle?: string;
  eyebrow?: string;
  footer?: string;
}

/** The set of preset ids — used by the route + index barrel. */
export const SOCIAL_TEMPLATE_IDS = [
  "announcement",
  "quote",
  "stat",
  "event",
  "launch",
] as const;

export type SocialTemplateId = (typeof SOCIAL_TEMPLATE_IDS)[number];

/**
 * announcementCard — general news / update. Calm chrome: neutral canvas,
 * accent rule + eyebrow, headline + supporting line.
 */
export function announcementCard(opts: BaseTemplateOpts): ReactElement {
  return (
    <SocialCard
      format={opts.format}
      product={opts.product}
      eyebrow={opts.eyebrow ?? "Announcement"}
      title={opts.title}
      subtitle={opts.subtitle}
      footer={opts.footer}
      variant="canvas"
    />
  );
}

/**
 * quoteCard — a pull-quote / testimonial. Large quotation glyph, attribution
 * rendered as the subtitle. World-builder wonder, so it stays on canvas.
 */
export function quoteCard(opts: BaseTemplateOpts & { attribution?: string }): ReactElement {
  const accent = resolveAccent(opts.product);
  return (
    <SocialCard
      format={opts.format}
      product={opts.product}
      eyebrow={opts.eyebrow ?? "In their words"}
      title={`“${opts.title}”`}
      subtitle={opts.attribution ?? opts.subtitle}
      footer={opts.footer}
      variant="canvas"
    >
      <div
        style={{
          display: "flex",
          width: "120px",
          height: "10px",
          background: accent,
          marginTop: "8px",
        }}
      />
    </SocialCard>
  );
}

/**
 * statCard — a single hero metric. The big number lives in the title slot
 * (Anton, all-caps numerals), with a label as the subtitle.
 */
export function statCard(opts: BaseTemplateOpts & { value: string; label?: string }): ReactElement {
  return (
    <SocialCard
      format={opts.format}
      product={opts.product}
      eyebrow={opts.eyebrow ?? opts.title}
      title={opts.value}
      subtitle={opts.label ?? opts.subtitle}
      footer={opts.footer}
      variant="canvas"
    />
  );
}

/**
 * eventCard — a date/venue card for a show or session. Surfaces the
 * date + venue as a structured detail block beneath the headline.
 */
export function eventCard(
  opts: BaseTemplateOpts & { date?: string; venue?: string },
): ReactElement {
  const detail = [opts.date, opts.venue].filter(Boolean).join("  ·  ");
  return (
    <SocialCard
      format={opts.format}
      product={opts.product}
      eyebrow={opts.eyebrow ?? "You're invited"}
      title={opts.title}
      subtitle={opts.subtitle}
      footer={opts.footer}
      variant="canvas"
    >
      {detail && (
        <div
          style={{
            display: "flex",
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: opts.format === "wide" ? 22 : 30,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: PALETTE.ink,
            marginTop: "12px",
          }}
        >
          {detail}
        </div>
      )}
    </SocialCard>
  );
}

/**
 * launchCard — the loud one. Full accent flood, AA-safe foreground. For
 * product launches / big reveals — wonder, not chrome.
 */
export function launchCard(opts: BaseTemplateOpts): ReactElement {
  return (
    <SocialCard
      format={opts.format}
      product={opts.product}
      eyebrow={opts.eyebrow ?? "Now live"}
      title={opts.title}
      subtitle={opts.subtitle}
      footer={opts.footer}
      variant="accent"
    />
  );
}

/** Narrowing guard for untrusted template ids (route segment). */
export function isSocialTemplateId(value: string): value is SocialTemplateId {
  return (SOCIAL_TEMPLATE_IDS as readonly string[]).includes(value);
}
