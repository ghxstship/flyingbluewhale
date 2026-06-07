import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { WorkspaceChrome, resolveSwitcherEntries } from "@/components/workspace-chrome/WorkspaceChrome";
import { mobileTabs, MOBILE_ROLES, ROLE_TABS, type MobileRole } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  // Protect the entire compvss shell — no session → redirect to /login.
  // Individual sub-pages may call requireSession() too; this is the outer guard.
  const session = await requireSession();
  const tenant = await resolveTenant();
  const supabase = await createClient();
  const switcherEntries = await resolveSwitcherEntries({
    supabase,
    userId: session.userId,
    role: session.role,
    currentPortalSlug: null,
  });
  // ADR-0009 — pick the role-tuned tab bar if the user has chosen a
  // mobile role via /m/settings/role. Otherwise serve the ADR-0006
  // generic deskless default (Home · Inbox · Shift · Alerts · Me).
  const { data: prefRow } = await supabase
    .from("user_preferences")
    .select("ui_state")
    .eq("user_id", session.userId)
    .maybeSingle();
  const uiState = (prefRow?.ui_state as { mobile_role?: MobileRole } | null) ?? null;
  const chosenRole = uiState?.mobile_role;
  const tabs = chosenRole && MOBILE_ROLES.includes(chosenRole) ? ROLE_TABS[chosenRole] : mobileTabs;
  return (
    <TenantShell tenant={tenant}>
      {/*
       * Theme lock — per v2 GHXSTSHIP handoff: SaaS shells (mobile/COMPVSS
       * included) paint with the neutral atlvs-product skin regardless of
       * the user's cosmic-marketing cookie pref.
       * data-platform="compvss" narrows the accent to brass amber.
       */}
      <div
        data-ui="saas"
        data-theme="atlvs-product"
        data-product="compvss"
        data-platform="compvss"
        className="page-shell mobile-shell"
      >
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
        <MobileTabBar items={tabs} />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
