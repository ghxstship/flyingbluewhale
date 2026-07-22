/**
 * ATLVS Email Kit — composable block builders.
 *
 * ── WHY INLINE HEX (and inline styles generally) ──────────────────────────
 * Email clients are NOT browsers. Gmail, Outlook (Word rendering engine),
 * Apple Mail, Yahoo, and the rest:
 *   - strip <style> blocks and <link>ed stylesheets (Gmail keeps some
 *     <style>, Outlook ignores most of it, others vary wildly),
 *   - do NOT support CSS custom properties (`var(--p-accent)` → nothing),
 *   - do NOT support fl/grid reliably (Outlook lays out with tables),
 *   - apply their own aggressive default styles you must override locally.
 *
 * The only thing that renders consistently everywhere is a *table-based*
 * layout with every style written INLINE as a hard-coded hex / px value.
 * That is why this kit centralizes the palette in `PALETTE` below and the
 * font stacks in `FONTS`, then INLINES those literal strings into every
 * element. There is no CSS-variable indirection at runtime — the constants
 * exist purely so the source has one place to edit, not so the client
 * resolves them. (CSS variables would silently fail in most inboxes.)
 *
 * Pure string builders only — no React, no DOM, no `react-dom/server`.
 * Each function returns an HTML fragment string safe to drop into a
 * table cell built by `layout.ts`.
 */
import { BRAND } from "@/lib/brand";

/**
 * Single source of truth for every color used in emails.
 *
 * REQUIRED to be literal hex — these values are inlined into `style="..."`
 * attributes. Do not reference CSS variables here; email clients can't read
 * them. Mirrors the ATLVS v8 "palette-locked" neutrals + the volcanic-red
 * house accent (tokens.json). Keep in sync with src/app/theme/tokens.json.
 */
export const PALETTE = {
  /** House / primary accent — ATLVS volcanic red. */
  accent: "#E23414",
  /** Darker red for pressed/hover affordances and link emphasis.
      (Re-seeded W1 2026-07-22: #B7270D had drifted from the tokens.json
      accent-hover canon.) */
  accentHover: "#C92C10",
  /** Foreground that sits on the accent fill (white passes AA on #E23414). */
  onAccent: "#FFFFFF",

  /** Page canvas (the area around the email card). */
  bg: "#F7F8FA",
  /** Card / content surface. */
  surface: "#FFFFFF",
  /** Subtle inset surface (footer band, code chips).
      (Re-seeded W1 2026-07-22: #F2F4F7 had drifted from the tokens.json
      surface-2 canon.) */
  surfaceInset: "#F1F3F6",

  /** Primary body + heading ink. */
  text: "#181B23",
  /** Secondary / supporting copy. */
  muted: "#4A5563",
  /** Tertiary — captions, legal, fallback URLs (AA floor). */
  tertiary: "#656D7A",

  /** Hairline borders + dividers. */
  border: "#E4E7EC",
} as const;

export type PaletteColor = keyof typeof PALETTE;

/**
 * Font stacks. Anton + Hanken Grotesk are web fonts that most mail clients
 * will NOT load, so every stack ends in a universally available fallback
 * (Arial Narrow for the condensed display face, Arial/Helvetica for body,
 * Courier for mono). Inlined into `font-family` declarations.
 */
export const FONTS = {
  /** Display / headings — Anton, degrading to a condensed system face. */
  heading:
    "'Anton', 'Arial Narrow', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  /** Body / UI — Hanken Grotesk, degrading to Arial. */
  body: "'Hanken Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  /** Eyebrows / IDs / code — Space Mono, degrading to Courier. */
  mono: "'Space Mono', 'Courier New', Courier, monospace",
} as const;

/** Button intent → fill / foreground pair. All literal hex (see PALETTE). */
export type ButtonTone = "primary" | "secondary";

/**
 * Escape a string for safe interpolation into HTML text / attribute context.
 * Block builders that accept caller-supplied *text* (labels, names, plain
 * strings) run it through here. Builders documented as accepting HTML
 * (`emailText`, `announcementEmail` body) intentionally do not.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * A call-to-action button rendered as a bulletproof, table-free anchor.
 * Padding + inline-block + explicit colors keep it clickable and styled in
 * Gmail, Apple Mail, and Outlook. `href` is emitted verbatim (callers pass
 * trusted, already-encoded URLs); `label` is escaped.
 */
export function emailButton({
  label,
  href,
  tone = "primary",
  accent,
  onAccent,
}: {
  label: string;
  href: string;
  tone?: ButtonTone;
  /** Optional co-brand fill override (literal hex) — producer-accent CTAs. */
  accent?: string;
  /** Foreground paired with `accent` (defaults to the house on-accent white). */
  onAccent?: string;
}): string {
  const fill = tone === "primary" ? (accent ?? PALETTE.accent) : PALETTE.surface;
  const fg = tone === "primary" ? (onAccent ?? PALETTE.onAccent) : (accent ?? PALETTE.accent);
  const border =
    tone === "primary" ? (accent ?? PALETTE.accent) : PALETTE.border;
  return `<a href="${href}" target="_blank" rel="noopener" style="display:inline-block;background:${fill};color:${fg};border:1px solid ${border};font-family:${FONTS.body};font-size:15px;font-weight:700;line-height:1;text-decoration:none;padding:14px 28px;border-radius:10px;mso-padding-alt:0;">${escapeHtml(
    label,
  )}</a>`;
}

/**
 * A heading. Level 1 is the Anton display headline (uppercase); level 2 is a
 * smaller Anton sub-headline; level 3 drops to Hanken Grotesk 700 sentence
 * case (per Monument 2.0 "Anton ceiling"). `text` is escaped.
 */
export function emailHeading(text: string, level: 1 | 2 | 3 = 1): string {
  const safe = escapeHtml(text);
  if (level === 3) {
    return `<h3 style="margin:0 0 8px;font-family:${FONTS.body};font-size:18px;font-weight:700;line-height:1.3;color:${PALETTE.text};">${safe}</h3>`;
  }
  const size = level === 1 ? 34 : 24;
  const tag = level === 1 ? "h1" : "h2";
  return `<${tag} style="margin:0 0 12px;font-family:${FONTS.heading};font-size:${size}px;font-weight:400;line-height:1.08;letter-spacing:0.01em;text-transform:uppercase;color:${PALETTE.text};">${safe}</${tag}>`;
}

/**
 * A body paragraph. Accepts trusted HTML so callers can include inline
 * <strong>/<a>/<br> — it is NOT escaped. Pass plain text through
 * `escapeHtml` first if it may contain user input.
 */
export function emailText(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONTS.body};font-size:15px;line-height:1.6;color:${PALETTE.muted};">${html}</p>`;
}

/** A small uppercase mono eyebrow / overline above a heading. Escaped. */
export function emailEyebrow(text: string): string {
  return `<p style="margin:0 0 10px;font-family:${FONTS.mono};font-size:11px;font-weight:700;letter-spacing:0.16em;line-height:1;text-transform:uppercase;color:${PALETTE.accent};">${escapeHtml(
    text,
  )}</p>`;
}

/** A full-width hairline divider. */
export function emailDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="border-top:1px solid ${PALETTE.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

/** Vertical whitespace of `px` pixels (table-based so Outlook honors it). */
export function emailSpacer(px: number): string {
  const h = Math.max(0, Math.round(px));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="${h}" style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</td></tr></table>`;
}

/**
 * A boxed monospace code / token panel — used for verification codes and
 * fallback URLs. `value` is escaped. `large` renders it as a centered,
 * spaced one-time-code block.
 */
export function emailCodePanel(value: string, large = false): string {
  const inner = large
    ? `font-size:30px;letter-spacing:0.32em;font-weight:700;text-align:center;`
    : `font-size:13px;word-break:break-all;`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;"><tr><td style="background:${PALETTE.surfaceInset};border:1px solid ${PALETTE.border};border-radius:10px;padding:16px 18px;font-family:${FONTS.mono};color:${PALETTE.text};${inner}">${escapeHtml(
    value,
  )}</td></tr></table>`;
}

/**
 * The header band — spaced ATLVS wordmark, optional logo image. `logoUrl`
 * must be an absolute https URL (mail clients can't resolve relative paths).
 */
export function emailHeader(logoUrl?: string): string {
  const mark = logoUrl
    ? `<img src="${logoUrl}" width="36" height="36" alt="ATLVS Technologies" style="display:block;border:0;border-radius:8px;" />`
    : `<div style="font-family:${FONTS.heading};font-size:20px;font-weight:400;letter-spacing:0.22em;line-height:1;text-transform:uppercase;color:${PALETTE.accent};">A T L V S</div>`;
  const subline = logoUrl
    ? ""
    : `<div style="font-family:${FONTS.mono};font-size:10px;letter-spacing:0.18em;line-height:1;text-transform:uppercase;color:${PALETTE.tertiary};margin-top:6px;">Technologies</div>`;
  return `<tr><td style="padding:22px 28px;border-bottom:1px solid ${PALETTE.border};background:${PALETTE.surface};">${mark}${subline}</td></tr>`;
}

/**
 * The footer band — org name, optional postal address, and the legally
 * required "this is a transactional message" affordance. `orgName` and
 * `address` are escaped. `prefsUrl` (absolute https) adds a "manage
 * notification emails" link — pass it for notification-class mail so
 * recipients can tune delivery instead of marking spam; omit it for
 * strictly transactional sends (verification, receipts).
 */
export function emailFooter(orgName: string, address?: string, prefsUrl?: string): string {
  const addr = address
    ? `<div style="margin-top:6px;color:${PALETTE.tertiary};">${escapeHtml(
        address,
      )}</div>`
    : "";
  const prefs = prefsUrl
    ? `<div style="margin-top:10px;"><a href="${prefsUrl}" target="_blank" rel="noopener" style="color:${PALETTE.tertiary};text-decoration:underline;">Manage notification emails</a></div>`
    : "";
  return `<tr><td style="padding:22px 28px;border-top:1px solid ${PALETTE.border};background:${PALETTE.bg};font-family:${FONTS.mono};font-size:11px;line-height:1.6;letter-spacing:0.04em;color:${PALETTE.tertiary};text-align:center;">
    <div style="color:${PALETTE.muted};font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${escapeHtml(
      orgName,
    )}</div>
    ${addr}
    ${prefs}
    <div style="margin-top:10px;">Powered by <a href="${BRAND.apexUrl}" target="_blank" rel="noopener" style="color:${PALETTE.accent};text-decoration:none;font-weight:700;">A T L V S</a></div>
  </td></tr>`;
}
