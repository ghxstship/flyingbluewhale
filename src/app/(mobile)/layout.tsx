import type { Metadata } from "next";
import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { SyncBanner } from "@/components/mobile/SyncBanner";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { WorkspaceChrome, resolveSwitcherEntries } from "@/components/workspace-chrome/WorkspaceChrome";
import { mobileTabs } from "@/lib/nav";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import CompvssOnboarding from "@/components/mobile/onboarding/CompvssOnboarding";

/**
 * COMPVSS field shell — the offline-first venue/field workforce PWA, rebuilt to
 * the COMPVSS Design System kit (2026-06-21). The bottom bar is the kit's
 * Home · Calendar · Tasks · Onsite · Assets · Inbox · More model (`mobileTabs`
 * — seven tabs; Onsite is the GVTEWAY consumer live-event tab added 2026-06-23,
 * documented in docs/compvss/KIT_CANON.md); the persona-routed /m/[role] tab
 * bars were retired with the role surfaces, so the shell renders one tab set
 * for every crew member.
 *
 * Auth gate: an unauthenticated visitor gets the **kit's own auth + onboarding
 * flow** (`CompvssOnboarding` — splash → sign up/in → verify → profile → join →
 * permissions → welcome → Rose → assignment), NOT the web `(auth)` screens.
 *
 * `data-platform="compvss"` narrows the neutral atlvs-product skin to the
 * signal-yellow accent (`#FFC400`, v8.0 palette-locked); CTAs render yellow
 * bg + dark ink (`.ps-btn--cta`).
 */

// The PWA manifest is scoped to this shell only (start_url/scope /m) so the
// console/portal/marketing shells don't advertise a COMPVSS install.
export const metadata: Metadata = {
  manifest: "/manifest.json",
};

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // No session → the COMPVSS kit onboarding owns the full screen (no chrome /
  // tab bar). Same compvss skin so the signal-yellow accent + tokens apply.
  if (!session) {
    return (
      <div
        data-ui="saas"
        data-theme="atlvs-product"
        data-product="compvss"
        data-platform="compvss"
        className="page-shell mobile-shell compvss-onboarding-shell"
      >
        <main id="main" tabIndex={-1} className="compvss-onboarding-main">
          <CompvssOnboarding />
        </main>
      </div>
    );
  }

  const tenant = await resolveTenant();
  const supabase = await createClient();
  const switcherEntries = await resolveSwitcherEntries({
    supabase,
    userId: session.userId,
    role: session.role,
    currentPortalSlug: null,
  });

  // Tab-bar badges — real reads, same semantics as the /m home widgets:
  // Tasks = my open tasks; Inbox = recent org chat activity (7-day proxy —
  // the inbox surface owns precise per-room unread accounting). Cheap
  // head-only counts; the client mirrors the sum to navigator.setAppBadge.
  const badges: Record<string, number> = {};
  if (hasSupabase) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ count: openTasks }, { count: unread }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("assigned_to", session.userId)
        .neq("task_state", "done"),
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .gte("created_at", sevenDaysAgo),
    ]);
    if (openTasks) badges["/m/tasks"] = openTasks;
    if (unread) badges["/m/inbox"] = unread;
  }

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
        <SyncBanner />
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
        <InstallPrompt />
        <MobileTabBar items={mobileTabs} badges={badges} />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
