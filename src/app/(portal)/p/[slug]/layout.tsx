import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeBranding, brandingToCssVars } from "@/lib/branding";
import { CommandPalette } from "@/components/CommandPalette";
import { portalNav, portalPersonaForSession } from "@/lib/nav";
import { navGroupKey, navItemKey } from "@/lib/i18n/nav-label";
import { PortalMobileNav, type PortalRailSection } from "@/components/PortalRailClient";
import { WorkspaceChrome } from "@/components/workspace-chrome/WorkspaceChrome";
import { AppRail } from "@/components/workspace-chrome/AppRail";
import { resolveAppRail } from "@/components/workspace-chrome/resolveAppRail";
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
  // Global App Rail — only for authenticated portal users (rule 2: never on
  // public surfaces); supersedes the top-bar popover here.
  const rail = session
    ? await resolveAppRail({
        shell: "portal",
        userId: session.userId,
        role: session.role,
        persona: session.persona,
        isDeveloper: session.isDeveloper,
        portalSlug: slug,
      })
    : null;

  // Mobile nav (C-01): the desktop persona rail is `hidden md:flex`, so
  // below `md` this drawer is the only nav path in the portal. It renders
  // the session persona's `portalNav` (neutral Workspace rail for
  // operators), translated here so the client half stays serializable.
  let mobileNavSections: PortalRailSection[] = [];
  if (session) {
    const group = portalNav(slug, portalPersonaForSession(session.persona));
    const sections = group.sections?.length ? group.sections : [{ label: group.label, items: group.items }];
    mobileNavSections = sections.map((section) => ({
      label: section.label ? t(navGroupKey(section), undefined, section.label) : "",
      items: section.items.map((i) => ({ href: i.href, label: t(navItemKey(i), undefined, i.label) })),
    }));
  }

  return (
    <div
      data-portal-slug={slug}
      data-theme="atlvs-product"
      data-platform="gvteway"
      style={style}
      className="flex min-h-screen"
    >
      {rail?.show ? <AppRail groups={rail.groups} activeId={rail.activeId} labels={rail.labels} /> : null}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
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
            switcherEntries={[]}
          />
        ) : null}
        {/* AX-4 — the portal shell had no <main> landmark, so the root skip
            link had nothing to land on and screen readers lacked a main-content
            anchor. tabIndex={-1} lets the skip link move focus here. */}
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        {session ? <PortalMobileNav sections={mobileNavSections} title={data.name ?? slug} /> : null}
        <CommandPalette
          scope="portal"
          portalSlug={slug}
          portalPersona={portalPersonaForSession(session?.persona) ?? undefined}
        />
      </div>
    </div>
  );
}
