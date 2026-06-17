import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeBranding, brandingToCssVars } from "@/lib/branding";
import { CommandPalette } from "@/components/CommandPalette";
import { portalPersonaForSession } from "@/lib/nav";
import { WorkspaceChrome, resolveSwitcherEntries } from "@/components/workspace-chrome/WorkspaceChrome";
import { getSession } from "@/lib/auth";
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

  // ADR-0007 — workspace chrome for portal. Anon (unauthenticated)
  // portal visitors still get the bare layout; chrome only renders when
  // a session exists so we don't surface bell/messages to non-users.
  const session = await getSession();
  const switcherEntries = session
    ? await resolveSwitcherEntries({ supabase, userId: session.userId, role: session.role, currentPortalSlug: slug })
    : [];

  return (
    <div data-portal-slug={slug} data-theme="atlvs-product" data-platform="gvteway" style={style}>
      {data?.branding && Object.keys(branding).length > 0 && (
        <a className="sr-only" href={`/p/${slug}`}>
          {t("p.shared.layout.srPortalLink", { name: data.name ?? slug }, `${data.name ?? slug} portal`)}
        </a>
      )}
      {session ? (
        <WorkspaceChrome
          shell="portal"
          workspaceLabel={data.name ?? slug}
          userEmail={session.email}
          messagesHref={`/p/${slug}/messages`}
          switcherEntries={switcherEntries}
        />
      ) : null}
      {/* AX-4 — the portal shell had no <main> landmark, so the root skip
          link had nothing to land on and screen readers lacked a main-content
          anchor. tabIndex={-1} lets the skip link move focus here. */}
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <CommandPalette
        scope="portal"
        portalSlug={slug}
        portalPersona={portalPersonaForSession(session?.persona) ?? undefined}
      />
    </div>
  );
}
