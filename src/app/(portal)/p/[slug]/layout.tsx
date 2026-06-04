import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeBranding, brandingToCssVars } from "@/lib/branding";
import { CommandPalette } from "@/components/CommandPalette";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Per-slug portal layout.
 * Loads project branding once and applies CSS custom properties so every
 * descendant inherits accent color, logo, etc.
 *
 * The slug → project lookup uses an anon-readable RLS policy on `projects`
 * (already in place for portal access).
 *
 * Hard-404 on unknown slug at the layout level so the HTTP status is 404,
 * not 200 (rls-boundaries.spec). Calling notFound() only from a child
 * page renders the not-found.tsx UI but the layout above had already
 * started streaming, so the response status stays 200 and slug
 * enumeration becomes possible.
 */
export default async function PortalSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name, branding").eq("slug", slug).maybeSingle();
  if (!data) notFound();

  const branding = safeBranding(data?.branding);
  const style = brandingToCssVars(branding) as React.CSSProperties;

  return (
    <div data-portal-slug={slug} style={style}>
      {data?.branding && Object.keys(branding).length > 0 && (
        <a className="sr-only" href={`/p/${slug}/overview`}>
          {t("p.shared.layout.srPortalLink", { name: data.name ?? slug }, `${data.name ?? slug} portal`)}
        </a>
      )}
      {children}
      <CommandPalette scope="portal" portalSlug={slug} />
    </div>
  );
}
