import "server-only";

import { resolveBrandContext, BRAND_FALLBACK } from "@/lib/branding";

/** Back-compat: the platform fallback accent when no branding resolves. */
export const DEFAULT_ACCENT = BRAND_FALLBACK.accent;

/**
 * Dual-brand token resolver — merges producer (org) branding with optional
 * client branding into one set of PDF-ready tokens. Used by every PDF
 * renderer so covers, headers, and footers pick up the right colors,
 * fonts, and logos with a single call.
 *
 * Inputs are Supabase jsonb (see `orgs.branding` and `clients.branding`).
 * Output is a flat struct with safe fallbacks — PDFs must never crash
 * because a tenant forgot to upload a logo.
 */

export type PdfBrand = {
  /** Producer (org) display name. */
  producerName: string;
  /** Producer logo URL (absolute; consumed by @react-pdf Image). */
  producerLogoUrl: string | null;
  /** Producer primary accent color (hex). */
  producerAccent: string;

  /** Optional client-side counterparts — only set when a client context exists. */
  clientName: string | null;
  clientLogoUrl: string | null;
  clientAccent: string | null;

  /** Footer legal line. Falls back to producer + year. */
  legalFooter: string;
};

/**
 * Resolve PDF branding from org + optional client rows. Delegates to the
 * shared `resolveBrandContext` cascade and flattens to the PDF token shape.
 * The producer is the from-entity; the client is the bill-to; the accent is
 * the joint (org-level) accent.
 */
export function resolvePdfBrand(args: {
  org: { name: string | null; name_override?: string | null; branding: unknown; logo_url?: string | null };
  client?: { name: string | null; branding?: unknown; logo_url?: string | null } | null;
  project?: { branding?: unknown } | null;
}): PdfBrand {
  const ctx = resolveBrandContext({ org: args.org, client: args.client, project: args.project });
  return {
    producerName: ctx.producer.name,
    producerLogoUrl: ctx.producer.logoUrl,
    producerAccent: ctx.joint.accent,
    clientName: ctx.client?.name ?? null,
    clientLogoUrl: ctx.client?.logoUrl ?? null,
    clientAccent: ctx.client?.accent ?? null,
    legalFooter: `© ${new Date().getUTCFullYear()} ${ctx.producer.name}${
      ctx.client?.name ? ` · Prepared for ${ctx.client.name}` : ""
    }`,
  };
}
