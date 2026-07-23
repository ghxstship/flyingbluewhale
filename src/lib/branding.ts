/**
 * Branding tokens + the layered Brand Context resolver — the ONE resolution
 * layer every branded surface goes through (Brand Studio canon, L-P3).
 *
 * ── Canonical resolution order ─────────────────────────────────────────────
 *
 * Three brand identities can co-brand a surface:
 *   · producer — the authoring org (`orgs.branding` + logo_url + name_override)
 *   · client   — the recipient org (`clients.branding` + logo_url) — an
 *                IDENTITY layer (co-brand lockup / bill-to), never a theme
 *                override: client branding does not repaint the joint accent.
 *   · joint    — the subject of the engagement: the accent/type the surface
 *                actually themes on, resolved by cascade, most specific wins:
 *
 *       proposal override  >  project (event kit)  >  org  >  BRAND_FALLBACK
 *
 * SSOT shapes live in jsonb (`orgs.branding`, `clients.branding`,
 * `projects.branding`, `proposals.branding`) — all the same `Branding` shape.
 * `safeBranding()` sanitizes untrusted jsonb; NOTHING may read the raw jsonb
 * fields directly (guarded by `src/lib/branding-consumer-canon.test.ts`).
 *
 * ── Document white-label modes (`data-brand` on `.doc`) ────────────────────
 *
 *   · "atlvs" — full ATLVS ecosystem chrome (default; org tokens still seed
 *               `--ob-*` so the masthead mark/name are the org's).
 *   · "co"    — org brand leads, "Powered by ATLVS" attribution line stays.
 *   · "white" — full white-label: org brand only, zero ATLVS marks.
 *
 * In "co"/"white" the kit CSS re-binds `--p-accent` to `--ob-accent`, so the
 * white-label mode WINS over the platform theme wherever it is set. The doc
 * token layer (`ResolvedBrand.doc`) carries ONLY explicitly-authored values —
 * no fallback hex — so an unbranded org keeps the platform token cascade and
 * the render is pixel-identical to before this layer existed.
 *
 * Consumers (all via `resolveBrand` / `resolveBrandContext`):
 *   · doc engine + string renderer — `resolveDocBrand` (documents/resolvers.ts)
 *   · PDF renderers — `resolvePdfBrand` (src/lib/pdf/branding.ts)
 *   · portal chrome — `(portal)/p/[slug]/layout.tsx` (project layer)
 *   · tenant console chrome — `src/components/TenantShell.tsx` (org layer)
 *   · public proposal/share token pages + proposal editor.
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

// ---------------------------------------------------------------------------
// resolveBrand — the one entry point (context + doc tokens + CSS vars).
// ---------------------------------------------------------------------------

/** The three `data-brand` white-label modes the documents kit renders. */
export const DOC_BRAND_MODES = ["atlvs", "co", "white"] as const;
export type DocBrandMode = (typeof DOC_BRAND_MODES)[number];

/**
 * Doc-engine token layer (`--ob-*` / `--cl-*` inline vars). Unlike
 * `BrandContext`, these carry ONLY explicitly-authored values — `undefined`
 * means "inherit the platform token cascade", which keeps unbranded orgs
 * pixel-identical in every `data-brand` mode.
 */
export type DocBrandTokens = {
  org: { name?: string; accent?: string; accentText?: string; logo?: string };
  client?: { name?: string; logo?: string };
};

export type ResolvedBrand = {
  /** Fallback-applied layered context (PDFs and previews need concrete hex). */
  context: BrandContext;
  /** The `data-brand` white-label mode this render was asked for. */
  docMode: DocBrandMode;
  /** Explicit-only doc tokens for the `--ob-*`/`--cl-*` inline var layer. */
  doc: DocBrandTokens;
  /** Joint-layer CSS custom properties (portal/proposal chrome root). */
  cssVars: Record<string, string>;
};

/**
 * The canonical resolver every brand consumer calls. Delegates the cascade to
 * `resolveBrandContext` (org < project < proposal override; client is an
 * identity layer) and derives, in one place:
 *   · `doc` — the explicit-only `--ob-*`/`--cl-*` token payload
 *   · `cssVars` — the joint-layer chrome override vars
 *   · `docMode` — the requested white-label mode (default "atlvs")
 */
export function resolveBrand(args: {
  org: Row;
  client?: Row | null;
  project?: { branding?: unknown } | null;
  proposalOverride?: unknown;
  docMode?: DocBrandMode;
}): ResolvedBrand {
  const context = resolveBrandContext(args);

  // Explicit-only doc cascade — same precedence, no fallback hex.
  const orgB = safeBranding(args.org.branding);
  const projectB = safeBranding(args.project?.branding);
  const overrideB = safeBranding(args.proposalOverride);
  const docAccent = overrideB.accentColor ?? projectB.accentColor ?? orgB.accentColor;
  const docAccentText = overrideB.accentForeground ?? projectB.accentForeground ?? orgB.accentForeground;
  const docLogo = context.producer.logoUrl ?? undefined;

  const doc: DocBrandTokens = {
    org: {
      name: context.producer.name,
      accent: docAccent,
      accentText: docAccentText,
      logo: docLogo,
    },
    client: context.client
      ? { name: context.client.name, logo: context.client.logoUrl ?? undefined }
      : undefined,
  };

  return {
    context,
    docMode: args.docMode ?? "atlvs",
    doc,
    cssVars: brandContextToCssVars(context),
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
