import "server-only";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

// ────────────────────────────────────────────────────────────────────
// SAML / OIDC helpers — server-only.
//
// Wrapper around Supabase Auth's `sso.providers` admin API. We bookkeep the
// provider in `org_sso_providers` (org_id, name, email_domains, enabled)
// and store the Supabase-side provider id in `supabase_id`. The actual
// SAML flow goes through Supabase Auth at:
//   /auth/v1/sso?domain=<email-domain>   or
//   /auth/v1/sso?provider=<supabase_id>
// — we don't proxy or shadow it here. This module is _only_ the
// configuration plumbing.
// ────────────────────────────────────────────────────────────────────

export type SamlProviderInput = {
  type: "saml" | "oidc";
  idpMetadataXml?: string;
  idpMetadataUrl?: string;
  emailDomains: string[];
};

export type SupabaseSsoProvider = {
  id: string;
  type: "saml" | "oidc";
  metadata_xml?: string;
  metadata_url?: string;
  domains?: Array<{ domain: string }>;
};

/**
 * Create a Supabase SSO provider. Returns the new provider id, or null when
 * the service-role client is not configured (preview deploys, missing env).
 *
 * The Supabase JS SDK exposes `auth.admin.sso.providers.create` only on
 * recent versions; we feature-detect to keep older builds compiling.
 */
export async function createSupabaseSsoProvider(input: SamlProviderInput): Promise<string | null> {
  if (!isServiceClientAvailable()) return null;
  const admin = createServiceClient();
  // The SDK type for sso is loose; we cast through `unknown` to avoid coupling
  // to a specific @supabase/supabase-js minor version.
  const auth = admin.auth as unknown as {
    admin: {
      sso?: {
        providers: {
          create(args: Record<string, unknown>): Promise<{
            data: { provider: SupabaseSsoProvider } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
  if (!auth.admin.sso) return null;
  const args: Record<string, unknown> = {
    type: input.type,
    domains: input.emailDomains.map((d) => ({ domain: d })),
  };
  if (input.idpMetadataXml) args.metadata_xml = input.idpMetadataXml;
  if (input.idpMetadataUrl) args.metadata_url = input.idpMetadataUrl;
  const { data, error } = await auth.admin.sso.providers.create(args);
  if (error || !data) return null;
  return data.provider.id;
}

/**
 * Delete a Supabase SSO provider. Returns true on success or when the SDK
 * route is unavailable (best-effort).
 */
export async function deleteSupabaseSsoProvider(supabaseId: string): Promise<boolean> {
  if (!isServiceClientAvailable()) return true;
  const admin = createServiceClient();
  const auth = admin.auth as unknown as {
    admin: {
      sso?: {
        providers: {
          remove?(id: string): Promise<{ error: { message: string } | null }>;
          delete?(id: string): Promise<{ error: { message: string } | null }>;
        };
      };
    };
  };
  if (!auth.admin.sso) return true;
  const fn = auth.admin.sso.providers.remove ?? auth.admin.sso.providers.delete;
  if (!fn) return true;
  const { error } = await fn(supabaseId);
  return !error;
}

/**
 * Build the public SP-side metadata (entity id, ACS URL) that an admin needs
 * to paste into their IdP. These come from Supabase Auth — we don't host an
 * SP ourselves. The shape mirrors the SmartSuite "Configure SSO" page.
 */
export function buildServiceProviderMetadata(supabaseProjectUrl: string): {
  entityId: string;
  acsUrl: string;
} {
  // Supabase Auth's SP metadata endpoint format. The exact path is stable
  // across project versions: /auth/v1/sso/saml/metadata exposes the SP XML;
  // the ACS URL is /auth/v1/sso/saml/acs.
  const base = supabaseProjectUrl.replace(/\/$/, "");
  return {
    entityId: `${base}/auth/v1/sso/saml/metadata`,
    acsUrl: `${base}/auth/v1/sso/saml/acs`,
  };
}

/** Lightweight email-domain validator. */
export function normalizeEmailDomains(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\s,;\n]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)),
    ),
  );
}
