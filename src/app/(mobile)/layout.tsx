import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { WorkspaceChrome, resolveSwitcherEntries } from "@/components/workspace-chrome/WorkspaceChrome";
import { mobileTabs } from "@/lib/nav";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * COMPVSS field shell — the offline-first venue/field workforce PWA, rebuilt to
 * the COMPVSS Design System kit (2026-06-21). The bottom bar is the kit's
 * Home · Calendar · Tasks · Assets · Inbox · More model (`mobileTabs`); the
 * persona-routed /m/[role] tab bars were retired with the role surfaces, so the
 * shell renders one tab set for every crew member.
 *
 * `data-platform="compvss"` narrows the neutral atlvs-product skin to the molten
 * brass amber accent; CTAs render amber bg + dark ink (`.ps-btn--cta`).
 */
export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  // Outer guard for the whole shell — no session → /login. Sub-pages may guard
  // again; this is the boundary.
  const session = await requireSession();
  const tenant = await resolveTenant();
  const supabase = await createClient();
  const switcherEntries = await resolveSwitcherEntries({
    supabase,
    userId: session.userId,
    role: session.role,
    currentPortalSlug: null,
  });

  return (
    <TenantShell tenant={tenant}>
      <div
        data-ui="saas"
        data-theme="atlvs-product"
        data-product="compvss"
        data-platform="compvss"
        className="page-shell mobile-shell"
      >
        <ConnectivityBanner />
        {/* Slim mobile chrome: app switcher + bell + messages + avatar. The
            org/project switcher re-scopes the data layer. */}
        <WorkspaceChrome
          shell="mobile"
          workspaceLabel={tenant.orgName}
          userEmail={session.email}
          messagesHref="/m/inbox"
          switcherEntries={switcherEntries}
        />
        <main id="main" tabIndex={-1} className="animate-fade-in">
          {children}
        </main>
        <MobileTabBar items={mobileTabs} />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
