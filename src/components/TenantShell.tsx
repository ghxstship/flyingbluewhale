import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeBranding, brandingToCssVars, type Branding } from "@/lib/branding";
import type { ReactNode, CSSProperties } from "react";

export type Tenant = {
  orgId?: string;
  orgName?: string;
  branding: Branding;
};

/**
 * Server-side tenant resolver. Looks up the active org via the `last_org_id`
 * preference (or the single membership if only one exists), reads the org's
 * branding jsonb, and returns the tokens for <TenantShell>.
 *
 * Wrapped in React's `cache()` so multiple server components in the same
 * request share one Supabase round-trip (H2-01 / IK-031). Cache scope is
 * per-request; it does not leak across users.
 */
export const resolveTenant = cache(async (): Promise<Tenant> => {
  try {
    const supabase = await createClient();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return { branding: {} };

    // Try last-used org from preferences first
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("last_org_id")
      .eq("user_id", u.user.id)
      .maybeSingle();

    let orgId = prefs?.last_org_id;

    // Fall back to first membership
    if (!orgId) {
      const { data: member } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      orgId = member?.org_id ?? null;
    }

    if (!orgId) return { branding: {} };

    const { data: org } = await supabase
      .from("orgs")
      .select("id, name, name_override, branding, logo_url")
      .eq("id", orgId)
      .maybeSingle();

    if (!org) return { branding: {} };

    const branding = safeBranding(org.branding);
    if (org.logo_url && !branding.logoUrl && /^https?:\/\//.test(org.logo_url)) {
      branding.logoUrl = org.logo_url;
    }

    return {
      orgId: org.id,
      orgName: org.name_override ?? org.name,
      branding,
    };
  } catch {
    return { branding: {} };
  }
});

/**
 * <TenantShell> — wrap every authenticated route group.
 * Applies per-org CSS variables and exposes the active org to children.
 *
 * For explicit overrides (e.g. public portals where the tenant is determined
 * by the route slug, not the session), pass `tenant` directly.
 */
export async function TenantShell({
  children,
  tenant,
  className,
}: {
  children: ReactNode;
  tenant?: Tenant;
  className?: string;
}) {
  const resolved = tenant ?? (await resolveTenant());
  const style = brandingToCssVars(resolved.branding) as CSSProperties;

  // Locale override from cookie for formatters
  const cs = await cookies();
  const locale = cs.get("locale")?.value;

  return (
    <div
      data-tenant={resolved.orgId}
      data-tenant-locale={locale}
      style={style}
      className={className}
    >
      {children}
    </div>
  );
}
