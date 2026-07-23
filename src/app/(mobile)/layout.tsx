import type { Metadata } from "next";
// Shell-split (perf, 2026-07-18): the COMPVSS mobile kit (68KB, scoped under
// .mobile-shell) + its auth/onboarding layer (scoped under .compvss-onboarding)
// ship ONLY on the /m shell now, not on every route via theme/index.css.
import "../theme/kit-mobile.css";
import "../theme/kit-onboarding.css";
import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { SyncBanner } from "@/components/mobile/SyncBanner";
import { SyncStampBar } from "@/components/mobile/SyncStampBar";
import { RefreshShell } from "@/components/mobile/RefreshShell";
import { InstallVisitBeacon } from "@/components/mobile/InstallCard";
import { SwUpdateToast } from "@/components/mobile/SwUpdateToast";
import { ScrollMemory } from "@/components/mobile/ScrollMemory";
import { StoragePersistence } from "@/components/mobile/StoragePersistence";
import { OfflineDrainer } from "@/components/mobile/OfflineDrainer";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import { MobileNavDrawer } from "@/components/mobile/MobileNavDrawer";
import { mobileTabs } from "@/lib/nav";
import { getSession, isManagerPlus } from "@/lib/auth";
import { OPEN_INSTANCE_STATES } from "@/lib/approvals/queries";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getActiveProject, type ActiveProject } from "@/lib/mobile/active-project";
import CompvssOnboarding from "@/components/mobile/onboarding/CompvssOnboarding";

/**
 * COMPVSS field shell — the offline-first venue/field workforce PWA, rebuilt to
 * the COMPVSS Design System kit (2026-06-21). The bottom bar is the kit's
 * Home · Calendar · Tasks · Assets · Inbox · More model (`mobileTabs` — six
 * tabs, documented in docs/compvss/KIT_CANON.md); the persona-routed /m/[role]
 * tab bars were retired with the role surfaces, so the shell renders one tab
 * set for every crew member.
 *
 * Crew-only by construction: the crew entitlement band carries no GVTEWAY reach
 * (`entitlements.json`), so consumer surfaces do not belong here. The GVTEWAY
 * Onsite tab added 2026-06-23 was rehomed to `/p/onsite` on 2026-07-15.
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

  // What a normal /m navigation actually needs: the two live count badges, the
  // bell's unread count, and the ONE live project for the app-bar context row.
  // The switcher's org/project/client/venue catalog (up to four more reads,
  // just to fill a drawer that stays closed almost always) is DEFERRED — the
  // sheet fetches it from /api/v1/me/switcher the first time it opens.
  //
  // Tab-bar badges: Tasks = my open tasks; Inbox = recent org chat activity
  // (7-day proxy — the inbox surface owns precise per-room unread accounting).
  // Cheap head-only counts; the client mirrors the sum to navigator.setAppBadge.
  const orgLabel = tenant.orgName ?? "Workspace";
  const canManage = isManagerPlus(session);
  const badges: Record<string, number> = {};
  let bellUnread = 0;
  let approvalsCount = 0;
  let activeProject: ActiveProject | null = null;
  if (hasSupabase) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ count: openTasks }, { count: unread }, { count: notifCount }, active] = await Promise.all([
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
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.userId)
        .is("read_at", null)
        .is("deleted_at", null),
      // Dedicated single-row read (React.cache()d — sibling /m pages dedupe).
      getActiveProject(session.orgId),
    ]);
    if (openTasks) badges["/m/tasks"] = openTasks;
    if (unread) badges["/m/inbox"] = unread;
    bellUnread = notifCount ?? 0;
    activeProject = active;

    // Kit 33 v3.0: the nav drawer's Manage → Approvals row carries a live
    // pending-approvals badge. Manager+ only (the group is hidden otherwise),
    // so we skip the read entirely for crew/external.
    if (canManage) {
      const { count: pendingApprovals } = await supabase
        .from("approval_instances")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .in("state", [...OPEN_INSTANCE_STATES]);
      approvalsCount = pendingApprovals ?? 0;
    }
  }

  // Kit avatar is initials, mono, on accent (`JG` for Joshamee Gibbs).
  const nameTokens = ((session.email ?? "there").split("@")[0] ?? "there").split(/[._-]+/);
  const initials =
    nameTokens
      .slice(0, 2)
      .map((s) => s.charAt(0).toUpperCase())
      .join("") || "?";
  // Nav-drawer identity header — display name + humanized platform role. These
  // are placeholder-tier (derived from the email local part) until a profile
  // display-name read is wired; the kit shows "Joshamee Gibbs · Gate Lead".
  const displayName =
    nameTokens
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ") || "Field Crew";
  const roleLabel =
    session.role.charAt(0).toUpperCase() + session.role.slice(1).replace(/_/g, " ");

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
        {/* The kit's own app bar (kit 28 `.appbar`): brand/Aurora AI · org +
            project context · search · bell · avatar. This shell used to render
            WorkspaceChrome, which is the CONSOLE's header — different
            structure, different controls, and no COMPVSS context row at all.
            The kit is the SSOT for this shell, so the kit's bar is what ships. */}
        <MobileAppBar
          orgName={orgLabel}
          projectName={activeProject?.name ?? null}
          projectLive={activeProject?.live ?? false}
          initials={initials}
          unread={bellUnread}
          currentOrgId={session.orgId}
          currentProjectId={activeProject?.id ?? null}
        />
        {/* Kit 32 B1: the online sync stamp ("Updated HH:MM · Tap To
            Refresh") rides under the app bar, and the pull-to-refresh
            gesture wraps the whole screen subtree — one shell-level pair,
            not per-screen copies. */}
        <SyncStampBar />
        <main id="main" tabIndex={-1} className="animate-fade-in">
          <RefreshShell>{children}</RefreshShell>
        </main>
        {/* Kit 32 F5: A2HS is now a CARD on /m/more (the kit's hub owns the
            affordance); the shell only runs the visit-count beacon that
            gates it + captures beforeinstallprompt. F4: the service-worker
            update toast ("New Version · Tap To Reload"). B6: per-tab scroll
            restore. */}
        <InstallVisitBeacon />
        <SwUpdateToast />
        <ScrollMemory />
        <StoragePersistence />
        {/* T1-1: app-level outbox drainer — replays BOTH offline queues on
            reconnect / tab return / interval, independent of which surface
            enqueued. Renders nothing; failures surface via <SyncBanner>. */}
        <OfflineDrainer />
        <MobileTabBar items={mobileTabs} badges={badges} />
        {/* Kit 33 v3.0: the More tab opens this left nav drawer (grouped IA +
            gated Manage section + footer) rather than routing to a list. It
            listens for the `compvss:nav-open` event the tab dispatches. */}
        <MobileNavDrawer
          name={displayName}
          roleLabel={roleLabel}
          initials={initials}
          orgName={orgLabel}
          projectName={activeProject?.name ?? null}
          projectLive={activeProject?.live ?? false}
          currentOrgId={session.orgId}
          currentProjectId={activeProject?.id ?? null}
          canManage={canManage}
          approvals={approvalsCount}
        />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
