/**
 * Branding tokens + the layered Brand Context resolver.
 *
 * Three brand identities can co-brand a document:
 *   · producer — the authoring org (`orgs.branding` + logo_url + name_override)
 *   · client   — the recipient org (`clients.branding` + logo_url)
 *   · joint    — the subject of the engagement: project/proposal accent,
 *                resolved by cascade (proposal override → project → org → BRAND)
 *
 * SSOT shapes live in jsonb (`orgs.branding`, `clients.branding`,
 * `projects.branding`, `proposals.branding`). `safeBranding()` sanitizes
 * untrusted input; `resolveBrandContext()` produces the flat context every
 * surface (proposal viewer, invoice PDF, email chrome) consumes.
 */
import { PRODUCT_ACCENTS } from "@/lib/brand";

export type Branding = {
  accentColor?: string; // CSS hex
  accentForeground?: string; // text color on accent
  secondaryColor?: string; // secondary/deep accent (deck gradients, balance cards)
  logoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  ogImageUrl?: string;
  productName?: string; // replaces the default "ATLVS Technologies" label inside the tenant shell
  headingFont?: string; // optional display font family name
  bodyFont?: string; // optional body font family name
  wordmark?: string; // optional letterspaced text mark (e.g. "G H X S T S H I P")
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const URL_PATTERN = /^https?:\/\//;
// Font family names: letters, numbers, spaces, hyphens; no CSS-injection chars.
const FONT_PATTERN = /^[A-Za-z0-9 \-]{1,48}$/;

/**
 * Sanitize untrusted branding input. Strips anything not matching expected
 * patterns to prevent CSS / URL injection.
 */
export function safeBranding(input: unknown): Branding {
  if (!input || typeof input !== "object") return {};
  const r = input as Record<string, unknown>;
  const out: Branding = {};
  if (typeof r.accentColor === "string" && HEX.test(r.accentColor)) out.accentColor = r.accentColor;
  if (typeof r.accentForeground === "string" && HEX.test(r.accentForeground)) out.accentForeground = r.accentForeground;
  if (typeof r.secondaryColor === "string" && HEX.test(r.secondaryColor)) out.secondaryColor = r.secondaryColor;
  if (typeof r.logoUrl === "string" && URL_PATTERN.test(r.logoUrl)) out.logoUrl = r.logoUrl;
  if (typeof r.faviconUrl === "string" && URL_PATTERN.test(r.faviconUrl)) out.faviconUrl = r.faviconUrl;
  if (typeof r.heroImageUrl === "string" && URL_PATTERN.test(r.heroImageUrl)) out.heroImageUrl = r.heroImageUrl;
  if (typeof r.ogImageUrl === "string" && URL_PATTERN.test(r.ogImageUrl)) out.ogImageUrl = r.ogImageUrl;
  if (typeof r.productName === "string" && r.productName.length <= 48) out.productName = r.productName;
  if (typeof r.headingFont === "string" && FONT_PATTERN.test(r.headingFont)) out.headingFont = r.headingFont;
  if (typeof r.bodyFont === "string" && FONT_PATTERN.test(r.bodyFont)) out.bodyFont = r.bodyFont;
  if (typeof r.wordmark === "string" && r.wordmark.length <= 64) out.wordmark = r.wordmark;
  return out;
}

/**
 * Returns CSS custom property overrides as an inline style object.
 * Accent + secondary override the proposal/portal `--p-*` token scope.
 */
export function brandingToCssVars(b: Branding): Record<string, string> {
  const v: Record<string, string> = {};
  if (b.accentColor) v["--p-accent"] = b.accentColor;
  if (b.accentForeground) v["--p-accent-contrast"] = b.accentForeground;
  if (b.secondaryColor) v["--p-accent-secondary"] = b.secondaryColor;
  if (b.headingFont) v["--p-font-heading"] = `'${b.headingFont}'`;
  if (b.bodyFont) v["--p-font-body"] = `'${b.bodyFont}'`;
  return v;
}

// ---------------------------------------------------------------------------
// Brand Context — the layered resolver consumed by every co-brandable surface.
// ---------------------------------------------------------------------------

/** A single party's resolved identity. */
export type BrandIdentity = {
  name: string;
  logoUrl: string | null;
  accent: string;
  accentFg: string;
};

/** Joint/subject styling — the accent + type the deck/invoice/email themes on. */
export type BrandJoint = {
  accent: string;
  accentFg: string;
  secondary: string;
  headingFont: string | null;
  bodyFont: string | null;
};

export type BrandContext = {
  producer: BrandIdentity;
  client: BrandIdentity | null;
  joint: BrandJoint;
};

/**
 * Platform fallback — the white-label cold-start seed. Accent sourced from the
 * canonical PRODUCT_ACCENTS owner; `accentFg`/`secondary` mirror tokens.json
 * (accent.atlvs.light: accent-cta-contrast + accent-cta — the deepened AA
 * companion used for deck gradients / balance cards). Re-seeded 2026-07-22
 * (owner ruling 4): the stale pre-v8.0 copper #6D4A2A is retired.
 */
export const BRAND_FALLBACK = {
  accent: PRODUCT_ACCENTS.atlvs,
  accentFg: "#FFFFFF",
  secondary: "#AD220A",
} as const;

type Row = { name?: string | null; name_override?: string | null; branding?: unknown; logo_url?: string | null };

function pickLogo(b: Branding, fallback: string | null): string | null {
  if (b.logoUrl && URL_PATTERN.test(b.logoUrl)) return b.logoUrl;
  if (fallback && URL_PATTERN.test(fallback)) return fallback;
  return null;
}

/**
 * Resolve the layered brand context for a document.
 *
 * Cascade for the JOINT accent (what the deck/invoice/email themes on):
 *   proposalOverride.accentColor → project.branding.accentColor →
 *   org.branding.accentColor → BRAND_FALLBACK.accent
 * Producer/client identities resolve from their own rows.
 */
export function resolveBrandContext(args: {
  org: Row;
  client?: Row | null;
  project?: { branding?: unknown } | null;
  proposalOverride?: unknown;
}): BrandContext {
  const orgB = safeBranding(args.org.branding);
  const clientRow = args.client ?? null;
  const clientB = clientRow ? safeBranding(clientRow.branding) : null;
  const projectB = safeBranding(args.project?.branding);
  const overrideB = safeBranding(args.proposalOverride);

  const producer: BrandIdentity = {
    name: args.org.name_override?.trim() || args.org.name || "Producer",
    logoUrl: pickLogo(orgB, args.org.logo_url ?? null),
    accent: orgB.accentColor ?? BRAND_FALLBACK.accent,
    accentFg: orgB.accentForeground ?? BRAND_FALLBACK.accentFg,
  };

  const client: BrandIdentity | null =
    clientRow && clientB
      ? {
          name: clientRow.name?.trim() || "Client",
          logoUrl: pickLogo(clientB, clientRow.logo_url ?? null),
          accent: clientB.accentColor ?? BRAND_FALLBACK.accent,
          accentFg: clientB.accentForeground ?? BRAND_FALLBACK.accentFg,
        }
      : null;

  // Joint cascade: override → project → org → fallback.
  const jointAccent = overrideB.accentColor ?? projectB.accentColor ?? orgB.accentColor ?? BRAND_FALLBACK.accent;
  const jointFg =
    overrideB.accentForeground ?? projectB.accentForeground ?? orgB.accentForeground ?? BRAND_FALLBACK.accentFg;
  const jointSecondary =
    overrideB.secondaryColor ?? projectB.secondaryColor ?? orgB.secondaryColor ?? BRAND_FALLBACK.secondary;
  const headingFont = overrideB.headingFont ?? projectB.headingFont ?? orgB.headingFont ?? null;
  const bodyFont = overrideB.bodyFont ?? projectB.bodyFont ?? orgB.bodyFont ?? null;

  return {
    producer,
    client,
    joint: { accent: jointAccent, accentFg: jointFg, secondary: jointSecondary, headingFont, bodyFont },
  };
}

/** CSS vars for the JOINT layer — applied on the proposal root so the whole deck themes. */
export function brandContextToCssVars(ctx: BrandContext): Record<string, string> {
  const v: Record<string, string> = {
    "--p-accent": ctx.joint.accent,
    "--p-accent-contrast": ctx.joint.accentFg,
    "--p-accent-secondary": ctx.joint.secondary,
  };
  if (ctx.joint.headingFont) v["--p-font-heading"] = `'${ctx.joint.headingFont}'`;
  if (ctx.joint.bodyFont) v["--p-font-body"] = `'${ctx.joint.bodyFont}'`;
  return v;
}
