import { PlatformSidebar } from "@/components/Shell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { NotificationsBell } from "@/components/NotificationsBell";
import { requireSession } from "@/lib/auth";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { platformNav } from "@/lib/nav";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Protects /console at the outer boundary so every page inherits the
  // guard; individual pages may still call requireSession() for session data.
  await requireSession("/login");
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
          <header className="glass-nav sticky top-0 z-30 flex items-center justify-between px-6 py-2.5">
            <div className="flex flex-1 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              <span className="text-[var(--org-primary)]">ATLVS</span>
              <span aria-hidden className="text-[var(--text-muted)]">·</span>
              <span className="hidden sm:inline">Operations Console</span>
            </div>
            <div className="flex items-center gap-2">
              <CommandPaletteTrigger />
              <NotificationsBell />
              <ThemeToggle />
            </div>
          </header>
          <div className="console-content animate-page-enter">{children}</div>
        </div>
        <CommandPalette scope="platform" />
      </div>
    </TenantShell>
  );
}
