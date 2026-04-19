import "server-only";

import type { Branding } from "@/lib/branding";
import { safeBranding } from "@/lib/branding";

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

export const DEFAULT_ACCENT = "#2563EB";

/**
 * Resolve PDF branding from org + optional client rows. Both may be partial.
 */
export function resolvePdfBrand(args: {
  org: { name: string | null; name_override?: string | null; branding: unknown; logo_url?: string | null };
  client?: { name: string | null; branding?: unknown; logo_url?: string | null } | null;
}): PdfBrand {
  const orgB: Branding = safeBranding(args.org.branding);
  const orgName = args.org.name_override?.trim() || args.org.name || "Producer";
  const orgLogo = pickLogo(orgB, args.org.logo_url ?? null);
  const orgAccent = pickAccent(orgB) ?? DEFAULT_ACCENT;

  const client = args.client ?? null;
  const clientB: Branding = safeBranding(client?.branding);
  const clientLogo = client ? pickLogo(clientB, client.logo_url ?? null) : null;
  const clientAccent = client ? pickAccent(clientB, null) : null;

  return {
    producerName: orgName,
    producerLogoUrl: orgLogo,
    producerAccent: orgAccent,
    clientName: client?.name ?? null,
    clientLogoUrl: clientLogo,
    clientAccent,
    legalFooter: `© ${new Date().getUTCFullYear()} ${orgName}${client?.name ? ` · Prepared for ${client.name}` : ""}`,
  };
}

function pickLogo(b: Branding, fallback: string | null): string | null {
  if (b.logoUrl && /^https?:\/\//.test(b.logoUrl)) return b.logoUrl;
  if (fallback && /^https?:\/\//.test(fallback)) return fallback;
  return null;
}

function pickAccent(b: Branding, fallback: string | null = DEFAULT_ACCENT): string | null {
  const raw = b.accentColor ?? null;
  if (typeof raw === "string" && /^#[0-9a-fA-F]{3,8}$/.test(raw)) return raw;
  return fallback;
}
