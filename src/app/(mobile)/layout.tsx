import type { Metadata } from "next";
import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { SyncBanner } from "@/components/mobile/SyncBanner";
import { SyncStampBar } from "@/components/mobile/SyncStampBar";
import { RefreshShell } from "@/components/mobile/RefreshShell";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { StoragePersistence } from "@/components/mobile/StoragePersistence";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { MobileAppBar } from "@/components/mobile/MobileAppBar";
import type { SwitcherOrg, SwitcherProject } from "@/components/mobile/MobileSwitcherSheet";
import { mobileTabs } from "@/lib/nav";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
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

  // App-bar data. The kit's context row names the ORG and the ACTIVE PROJECT
  // with a live dot — the two facts a crew member needs to know they're
  // looking at the right world before they read anything else.
  // The user's real orgs — from their memberships. (`resolveSwitcherEntries`
  // is the cross-PRODUCT switcher, ATLVS/GVTEWAY/COMPVSS; it is not this.)
  const orgLabel = tenant.orgName ?? "Workspace";
  let switcherOrgs: SwitcherOrg[] = [{ id: session.orgId, name: orgLabel, sub: "Organization" }];

  let switcherProjects: SwitcherProject[] = [];
  let activeProject: { id: string; name: string; live: boolean } | null = null;
  let bellUnread = 0;
  if (hasSupabase) {
    // The kit's project row reads `name / client · venue / location · sub`, so
    // client and venue are joins. Resolved in a second pass rather than an
    // embed: the FK-hinted `locations!projects_primary_venue_id_fkey(...)`
    // form overflows PostgREST's generic inference (TS2589), and two indexed
    // reads are cheaper to understand than a cast that hides the shape.
    const [{ data: projectRows }, { count: notifCount }, { data: memberRows }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, project_state, start_date, client_id, primary_venue_id")
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .order("start_date", { ascending: false, nullsFirst: false })
        .limit(50),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.userId)
        .is("read_at", null)
        .is("deleted_at", null),
      supabase
        .from("memberships")
        .select("org_id, orgs(name, tier)")
        .eq("user_id", session.userId)
        .is("deleted_at", null),
    ]);
    bellUnread = notifCount ?? 0;

    const orgList = ((memberRows ?? []) as unknown as { org_id: string; orgs: { name?: string; tier?: string } | null }[])
      .filter((m) => m.orgs?.name)
      .map((m) => ({ id: m.org_id, name: m.orgs!.name!, sub: m.orgs?.tier ? `${m.orgs.tier} plan` : "Organization" }));
    if (orgList.length) switcherOrgs = orgList;

    const projRows = projectRows ?? [];
    const clientIds = Array.from(new Set(projRows.map((p) => p.client_id).filter(Boolean))) as string[];
    const venueIds = Array.from(new Set(projRows.map((p) => p.primary_venue_id).filter(Boolean))) as string[];
    const [{ data: clientRows }, { data: venueRows }] = await Promise.all([
      clientIds.length
        ? supabase.from("clients").select("id, name").in("id", clientIds).is("deleted_at", null)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      venueIds.length
        ? supabase.from("locations").select("id, name, city, country").in("id", venueIds)
        : Promise.resolve({ data: [] as { id: string; name: string; city: string | null; country: string | null }[] }),
    ]);
    const clientById = new Map((clientRows ?? []).map((c) => [c.id, c.name]));
    const venueById = new Map((venueRows ?? []).map((v) => [v.id, v]));

    switcherProjects = projRows.map((p) => {
      // Kit chips are exactly Live / Planning / Closed — map project_state onto
      // those three rather than inventing a fourth the filter can't reach.
      const status: SwitcherProject["status"] =
        p.project_state === "active" ? "Live" : p.project_state === "draft" || p.project_state === "paused" ? "Planning" : "Closed";
      const venue = p.primary_venue_id ? venueById.get(p.primary_venue_id) : null;
      const place = [venue?.city, venue?.country].filter(Boolean).join(", ");
      return {
        id: p.id,
        name: p.name,
        client: (p.client_id ? clientById.get(p.client_id) : null) ?? "—",
        venue: venue?.name ?? "—",
        location: place || "—",
        status,
        sub: status === "Live" ? "Live Now" : (p.start_date ?? status),
      };
    });
    const live = switcherProjects.find((p) => p.status === "Live");
    if (live) activeProject = { id: live.id, name: live.name, live: true };
  }

  // Kit avatar is initials, mono, on accent (`JG` for Joshamee Gibbs).
  const initials = ((session.email ?? "?").split("@")[0] ?? "?")
    .split(/[._-]+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("") || "?";

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
          orgs={switcherOrgs}
          projects={switcherProjects}
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
        <InstallPrompt />
        <StoragePersistence />
        <MobileTabBar items={mobileTabs} badges={badges} />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
