import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { WorkspaceChrome, defaultSwitcherEntries } from "@/components/workspace-chrome/WorkspaceChrome";
import { mobileTabs } from "@/lib/nav";
import { requireSession } from "@/lib/auth";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  // Protect the entire compvss shell — no session → redirect to /login.
  // Individual sub-pages may call requireSession() too; this is the outer guard.
  const session = await requireSession();
  const tenant = await resolveTenant();
  const switcherEntries = defaultSwitcherEntries(session.role, null);
  return (
    <TenantShell tenant={tenant}>
      {/*
       * Theme lock — per v2 GHXSTSHIP handoff: SaaS shells (mobile/COMPVSS
       * included) paint with the neutral atlvs-product skin regardless of
       * the user's cosmic-marketing cookie pref.
       * data-platform="compvss" narrows the accent to brass amber.
       */}
      <div data-theme="atlvs-product" data-platform="compvss" className="page-shell mobile-shell">
        <ConnectivityBanner />
        {/* ADR-0007: slim 44px chrome for mobile. Bottom tab bar still
            owns primary nav; this band hosts the app switcher + bell +
            messages + avatar so the user can cross shells without
            digging into Me. */}
        <WorkspaceChrome
          shell="mobile"
          workspaceLabel={tenant.orgName}
          userEmail={session.email}
          messagesHref="/m/inbox"
          switcherEntries={switcherEntries}
        />
        <main className="animate-fade-in">{children}</main>
        <MobileTabBar items={mobileTabs} />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
