import { PlatformSidebar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { WorkspaceChrome } from "@/components/workspace-chrome/WorkspaceChrome";
import { AppRail } from "@/components/workspace-chrome/AppRail";
import { resolveAppRail } from "@/components/workspace-chrome/resolveAppRail";
import { requireSession } from "@/lib/auth";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { platformNav } from "@/lib/nav";
import { getNavCounts } from "@/lib/nav-counts";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Protects /studio at the outer boundary so every page inherits the
  // guard; individual pages may still call requireSession() for session data.
  // Session is the auth gate — it must resolve first (it may redirect). It's
  // request-memoized via React cache(), so child pages re-calling it are free.
  const session = await requireSession();

  // The remaining reads are independent of each other; run them concurrently
  // instead of serially. resolveTenant/getRequestT each open their own
  // (request-memoized) Supabase client + auth lookup; the two pref/dashboard
  // reads share the client created here.
  const supabase = await createClient();
  const [tenant, { t }, prefResult, dashboardResult, navCounts] = await Promise.all([
    resolveTenant(),
    getRequestT(),
    // Read last_portal_slug (app-switcher orientation) non-blocking — fall
    // through if the pref row hasn't materialized yet (new users / first signin).
    supabase.from("user_preferences").select("ui_state").eq("user_id", session.userId).maybeSingle(),
    // ADR-0007 — pre-fetch saved dashboards for the chrome top-bar menu.
    // Hard-cap at 8 so the popover stays scannable; "All Dashboards" footer
    // always links to /studio/dashboards for the full list.
    supabase
      .from("dashboards")
      .select("id, name")
      .eq("org_id", session.orgId)
      .order("name", { ascending: true })
      .limit(8),
    // Live rail count badges (kit 21 W1) — unread rooms · my open tasks ·
    // approvals waiting on me. Recomputed every navigation / router.refresh().
    getNavCounts(supabase, { userId: session.userId, orgId: session.orgId, role: session.role }),
  ]);

  const uiState = (prefResult.data?.ui_state as { last_portal_slug?: string } | null) ?? null;
  const dashboards = (dashboardResult.data ?? []).map((d) => ({
    id: d.id as string,
    name: (d.name as string) ?? "Untitled",
    href: `/studio/dashboards/${d.id}`,
  }));
  // Global App Rail — the persistent cross-product switcher (supersedes the
  // top-bar popover here). Needs uiState (last_portal_slug) resolved above, so
  // it follows the parallel batch rather than joining it.
  const rail = await resolveAppRail({
    shell: "platform",
    userId: session.userId,
    role: session.role,
    persona: session.persona,
    isDeveloper: session.isDeveloper,
    portalSlug: uiState?.last_portal_slug ?? null,
  });
  return (
    <TenantShell tenant={tenant}>
      {/*
       * Theme lock — per the v2 GHXSTSHIP handoff
       * (design_handoff/ATLVS_PRODUCT/README.md), the SaaS console
       * MUST paint with the neutral atlvs-product skin, not the cosmic
       * GHXSTSHIP brand. data-theme here overrides the html-level slug
       * for this subtree, so the user's cookie pref still controls the
       * marketing site while /studio stays canonical regardless.
       * data-platform="atlvs" narrows the accent to nebula pink.
       */}
      <div
        data-ui="saas"
        data-theme="atlvs-product"
        data-product="atlvs"
        data-platform="atlvs"
        className="console-shell"
      >
        {rail.show ? <AppRail groups={rail.groups} activeId={rail.activeId} labels={rail.labels} /> : null}
        <PlatformSidebar groups={platformNav} workspaceName={tenant.orgName} counts={navCounts} />
        <div className="console-main">
          {/*
           * Canonical SaaS topbar — per ui_kits/atlvs/dashboard.html .top.
           * The pre-v3 layout pinned a cosmic "ATLVS THE BRIDGE" lockup
           * (Big Shoulders display, brass accent) which violated the
           * "deliberately NOT the cosmic-voyage GHXSTSHIP aesthetic" rule
           * for SaaS surfaces (design_handoff/ATLVS_PRODUCT/README.md).
           *
           * The page-level ModuleHeader carries the crumb + h1 per route;
           * this band only hosts the global action cluster (command
           * palette, notifications, theme, profile) plus the workspace
           * orientation handed up from the sidebar's WorkspaceSwitcher.
           */}
          {/* ADR-0007: shared workspace chrome — same component used by
              all three shells with per-shell skin. The MobileNavDrawer
              slot holds the mobile-only hamburger; desktop sidebar takes
              over at md+. */}
          <WorkspaceChrome
            shell="platform"
            workspaceLabel={tenant.orgName}
            userEmail={session.email}
            userName={session.email || t("console.layout.userFallback", undefined, "User")}
            messagesHref="/studio/inbox"
            dashboards={dashboards}
            switcherEntries={[]}
            navDrawer={<MobileNavDrawer groups={platformNav} />}
          />
          {/*
           * <main> landmark — Sea Trial FINDING-004. Was a generic <div>
           * which left screen readers without a "main content" anchor for
           * skip-to-content / ARIA navigation. Wrapping the page slot in
           * <main id="main"> lets the layout's "Skip to content" link land
           * correctly and matches the marketing/portal/mobile shells.
           */}
          <main id="main" tabIndex={-1} className="console-content animate-page-enter">
            {children}
          </main>
        </div>
        <CommandPalette scope="platform" />
      </div>
    </TenantShell>
  );
}
