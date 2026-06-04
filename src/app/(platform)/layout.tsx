import { PlatformSidebar } from "@/components/Shell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AvatarMenu } from "@/components/AvatarMenu";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { requireSession } from "@/lib/auth";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { platformNav } from "@/lib/nav";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Protects /console at the outer boundary so every page inherits the
  // guard; individual pages may still call requireSession() for session data.
  const session = await requireSession("/login");
  const tenant = await resolveTenant();
  return (
    <TenantShell tenant={tenant}>
      {/*
       * Theme lock — per the v2 GHXSTSHIP handoff
       * (design_handoff/ATLVS_PRODUCT/README.md), the SaaS console
       * MUST paint with the neutral atlvs-product skin, not the cosmic
       * GHXSTSHIP brand. data-theme here overrides the html-level slug
       * for this subtree, so the user's cookie pref still controls the
       * marketing site while /console stays canonical regardless.
       * data-platform="atlvs" narrows the accent to nebula pink.
       */}
      <div data-theme="atlvs-product" data-platform="atlvs" className="console-shell">
        <PlatformSidebar groups={platformNav} workspaceName={tenant.orgName} />
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
          <header className="glass-nav sticky top-0 z-30 flex shrink-0 items-center gap-2 px-4 sm:px-6">
            {/* Mobile-only hamburger — opens the platform nav as an off-
                canvas drawer. The desktop PlatformSidebar is hidden at
                `< md` (it would swallow 240px of a 375px phone viewport).
                On md+ this button is `display: none` and the sidebar
                takes over. */}
            <MobileNavDrawer groups={platformNav} />
            <div className="ms-auto flex items-center gap-2">
              <CommandPaletteTrigger />
              <NotificationsBell />
              <ThemeToggle />
              <AvatarMenu name={session.email || "User"} email={session.email} />
            </div>
          </header>
          {/*
           * <main> landmark — Sea Trial FINDING-004. Was a generic <div>
           * which left screen readers without a "main content" anchor for
           * skip-to-content / ARIA navigation. Wrapping the page slot in
           * <main id="main"> lets the layout's "Skip to content" link land
           * correctly and matches the marketing/portal/mobile shells.
           */}
          <main id="main" className="console-content animate-page-enter">
            {children}
          </main>
        </div>
        <CommandPalette scope="platform" />
      </div>
    </TenantShell>
  );
}
