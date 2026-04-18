import { createClient } from "@/lib/supabase/server";
import { safeBranding, brandingToCssVars } from "@/lib/branding";

/**
 * Per-slug portal layout.
 * Loads project branding once and applies CSS custom properties so every
 * descendant inherits accent color, logo, etc.
 *
 * The slug → project lookup uses an anon-readable RLS policy on `projects`
 * (already in place for portal access).
 */
export default async function PortalSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("name, branding")
    .eq("slug", slug)
    .maybeSingle();

  const branding = safeBranding(data?.branding);
  const style = brandingToCssVars(branding) as React.CSSProperties;

  return (
    <div data-portal-slug={slug} style={style}>
      {data?.branding && Object.keys(branding).length > 0 && (
        <a className="sr-only" href={`/p/${slug}/overview`}>
          {data.name ?? slug} portal
        </a>
      )}
      {children}
    </div>
  );
}
