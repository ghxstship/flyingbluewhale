import * as React from "react";
import { CommandPaletteTrigger } from "@/components/CommandPalette";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AvatarMenu } from "@/components/AvatarMenu";
import { urlFor } from "@/lib/urls";
import { AppSwitcher, type AppSwitcherEntry } from "./AppSwitcher";
import { HelpButton } from "./HelpButton";
import { MessagesButton } from "./MessagesButton";
import { DashboardsMenu, type DashboardEntry } from "./DashboardsMenu";

/**
 * Shared workspace chrome (ADR-0007).
 *
 * One horizontal band at the top of every shell — same component, three
 * theme skins via `data-shell`. Standard order, left to right:
 *
 *   [AppSwitcher] [WorkspaceLabel]    spacer    [⌘K] [Dashboards*] [?] [Bell] [Messages] [Theme] [Avatar]
 *
 * `*` Dashboards menu renders on ATLVS only — it's an operator-console
 * convenience, not a portal/mobile concern.
 *
 * This is a Server Component so each shell's layout passes its own
 * session-derived data (workspace label, switcher entries, messages
 * URL) and the chrome composes them. The interactive pieces inside
 * (NotificationsBell, AvatarMenu, AppSwitcher, etc.) are client islands.
 */
export type WorkspaceChromeProps = {
  shell: "platform" | "portal" | "mobile";
  /** Tenant / project name shown next to the app switcher. */
  workspaceLabel: string | undefined;
  /** Authenticated user identity for the avatar. */
  userEmail: string | null | undefined;
  userName?: string | null;
  /** The destination for the Messages affordance. Each shell points at
   *  its canonical messages surface. */
  messagesHref: string;
  /** Pre-fetched saved dashboards for the Dashboards menu. ATLVS only;
   *  ignored when shell !== "platform". */
  dashboards?: DashboardEntry[];
  /** Shells the user has access to. Pass [] to hide the switcher
   *  (single-app users). */
  switcherEntries: AppSwitcherEntry[];
  /** Optional slot for a shell-specific extra (e.g. mobile nav drawer
   *  hamburger in the platform shell at sub-md viewports). */
  navDrawer?: React.ReactNode;
};

export function WorkspaceChrome({
  shell,
  workspaceLabel,
  userEmail,
  userName,
  messagesHref,
  dashboards,
  switcherEntries,
  navDrawer,
}: WorkspaceChromeProps) {
  const heightClass = shell === "mobile" ? "h-11" : "h-14";
  return (
    <header
      data-shell={shell}
      className={`workspace-chrome glass-nav sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b border-[var(--border-color)] px-3 sm:px-4 ${heightClass}`}
    >
      {navDrawer}
      <AppSwitcher current={shell} entries={switcherEntries} />
      {workspaceLabel ? (
        <span className="hidden truncate text-sm font-medium text-[var(--text-secondary)] sm:inline">
          {workspaceLabel}
        </span>
      ) : null}
      <div className="ms-auto flex items-center gap-0.5">
        <CommandPaletteTrigger />
        {shell === "platform" && dashboards !== undefined ? <DashboardsMenu entries={dashboards} /> : null}
        <HelpButton />
        <NotificationsBell />
        <MessagesButton href={messagesHref} />
        {shell !== "mobile" ? <ThemeToggle /> : null}
        <AvatarMenu name={userName ?? userEmail ?? "User"} email={userEmail ?? undefined} />
      </div>
    </header>
  );
}

/**
 * Helper: compute the app-switcher entries a session can reach.
 *
 * Original MVP used `role` heuristics. ADR-0007 §"App switcher
 * capability rules" promised refinement to query actual memberships.
 * This sync wrapper preserves the original signature for the small
 * number of callers that don't have a supabase client in scope; new
 * code should prefer `resolveSwitcherEntries()` below which queries
 * `project_members` to detect portal eligibility.
 */
export function defaultSwitcherEntries(role: string | null, currentPortalSlug: string | null): AppSwitcherEntry[] {
  const entries: AppSwitcherEntry[] = [];
  if (role) {
    entries.push({ shell: "platform", label: "ATLVS", href: urlFor("platform", "/console") });
  }
  if (role && role !== "viewer") {
    entries.push({
      shell: "portal",
      label: "GVTEWAY",
      href: urlFor("portal", currentPortalSlug ? `/p/${currentPortalSlug}` : "/p"),
    });
  }
  entries.push({ shell: "mobile", label: "COMPVSS", href: urlFor("mobile", "/m") });
  return entries;
}

/**
 * Capability-aware app switcher resolver (ADR-0007 follow-up).
 *
 * Queries the membership tables to determine real cross-shell access
 * instead of guessing from `role`. Layout callers that have a supabase
 * client in scope should prefer this over `defaultSwitcherEntries`.
 *
 *   - **Platform**: signed-in user with any active org membership.
 *   - **Portal**: user has at least one `project_members` row OR an
 *     `account_manager_assignments` row (assigned to a portal persona).
 *   - **Mobile**: always available — COMPVSS is opt-in (PWA install +
 *     `compvss.*` host gate real access).
 *
 * Errors fall through to the heuristic version so a missing column or
 * network blip can't hide the switcher entirely.
 */
type SwitcherCapabilityClient = {
  from: (table: string) => {
    select: (
      cols: string,
      opts?: { count?: "exact"; head?: boolean },
    ) => {
      eq: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>;
    };
  };
};

export async function resolveSwitcherEntries(opts: {
  supabase: unknown;
  userId: string;
  role: string | null;
  currentPortalSlug: string | null;
}): Promise<AppSwitcherEntry[]> {
  const { supabase, userId, role, currentPortalSlug } = opts;
  const entries: AppSwitcherEntry[] = [];
  if (role) {
    entries.push({ shell: "platform", label: "ATLVS", href: urlFor("platform", "/console") });
  }
  let hasPortal = false;
  try {
    const sb = supabase as SwitcherCapabilityClient;
    // Cheapest detection: any project_members row for this user.
    // RLS already scopes; we only need a count > 0.
    const { count } = await sb
      .from("project_members")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) > 0) hasPortal = true;
  } catch {
    // Fall through to role-heuristic below.
  }
  if (!hasPortal && role && role !== "viewer") hasPortal = true;
  if (hasPortal) {
    entries.push({
      shell: "portal",
      label: "GVTEWAY",
      href: urlFor("portal", currentPortalSlug ? `/p/${currentPortalSlug}` : "/p"),
    });
  }
  entries.push({ shell: "mobile", label: "COMPVSS", href: urlFor("mobile", "/m") });
  return entries;
}
