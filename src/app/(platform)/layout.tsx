import { PlatformSidebar } from "@/components/Shell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AvatarMenu } from "@/components/AvatarMenu";
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
      <div data-platform="atlvs" className="console-shell">
        <PlatformSidebar groups={platformNav} workspaceName={tenant.orgName} />
        <div className="console-main">
          {/*
           * Glass nav — IA redesign (docs/ia/02-navigation-redesign.md §3.3).
           * The static "Console" label was removed; the page's ModuleHeader
           * now carries orientation via breadcrumbs. The right-hand cluster
           * keeps the canonical global actions: command palette trigger,
           * notifications bell, theme toggle.
           */}
          <header className="glass-nav sticky top-0 z-30 flex shrink-0 items-center justify-between px-6">
            <div className="flex flex-1 items-center gap-2 text-xs font-semibold tracking-wide text-[var(--text-muted)]">
              <span className="tracking-wider text-[var(--org-primary)]" aria-label="ATLVS Technologies">A T L V S</span>
            </div>
            <div className="flex items-center gap-2">
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
