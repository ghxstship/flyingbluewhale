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
 * MVP rules (refined in ADR-0007 §"App switcher capability rules"):
 *   - Platform: any signed-in user with a role.
 *   - Portal: any user with a project membership exposing a portal
 *     persona. For MVP we just check role !== "viewer" — refine later.
 *   - Mobile: any user (mobile is opt-in; PWA install gates real access).
 *
 * `currentPortalSlug` is threaded through so the switcher's Portal
 * entry deep-links to the user's most recent portal slug rather than a
 * generic chooser. Pass `null` to fall through to `/p/select`.
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
