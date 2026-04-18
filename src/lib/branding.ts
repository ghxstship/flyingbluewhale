/**
 * Per-project branding tokens. SSOT lives in `projects.branding` (jsonb).
 * Apply at the shell level by setting CSS custom properties via inline style.
 */

export type Branding = {
  accentColor?: string;       // CSS color
  accentForeground?: string;  // text color on accent
  logoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  ogImageUrl?: string;
  productName?: string;       // replaces "flyingbluewhale" inside the tenant shell
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const URL_PATTERN = /^https?:\/\//;

/**
 * Sanitize untrusted branding input. Strips anything not matching expected
 * patterns to prevent CSS / URL injection.
 */
export function safeBranding(input: unknown): Branding {
  if (!input || typeof input !== "object") return {};
  const r = input as Record<string, unknown>;
  const out: Branding = {};
  if (typeof r.accentColor === "string" && HEX.test(r.accentColor)) {
    out.accentColor = r.accentColor;
  }
  if (typeof r.accentForeground === "string" && HEX.test(r.accentForeground)) {
    out.accentForeground = r.accentForeground;
  }
  if (typeof r.logoUrl === "string" && URL_PATTERN.test(r.logoUrl)) out.logoUrl = r.logoUrl;
  if (typeof r.faviconUrl === "string" && URL_PATTERN.test(r.faviconUrl)) out.faviconUrl = r.faviconUrl;
  if (typeof r.heroImageUrl === "string" && URL_PATTERN.test(r.heroImageUrl)) out.heroImageUrl = r.heroImageUrl;
  if (typeof r.ogImageUrl === "string" && URL_PATTERN.test(r.ogImageUrl)) out.ogImageUrl = r.ogImageUrl;
  if (typeof r.productName === "string" && r.productName.length <= 48) out.productName = r.productName;
  return out;
}

/**
 * Returns CSS custom property overrides as an inline style object.
 * Accent color overrides --org-primary inside a scoped div.
 */
export function brandingToCssVars(b: Branding): Record<string, string> {
  const v: Record<string, string> = {};
  if (b.accentColor) v["--org-primary"] = b.accentColor;
  if (b.accentForeground) v["--org-on-primary"] = b.accentForeground;
  return v;
}
