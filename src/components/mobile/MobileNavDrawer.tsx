"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { moreNavGroups, type MoreNavLink } from "@/lib/nav";
import { MobileSwitcherSheet } from "./MobileSwitcherSheet";
import { useThemeIfAvailable } from "@/app/theme/ThemeProvider";

/**
 * COMPVSS nav drawer — the More tab (kit 33 v3.0).
 *
 * The bottom "More" tab opens this left slide-in drawer instead of routing to a
 * full-screen list, matching the ATLVS web sidebar. Structure (kit
 * `NAV_GROUPS`, runtime/app.jsx:4886):
 *   identity header (→ Profile) + workspace switcher
 *   · search-to-filter
 *   · grouped IA (`moreNavGroups`) — My Work · Workplace · Operations ·
 *     People & Teams · Opportunities, then the perm-gated **Manage** control
 *     plane (hidden entirely for crew / external)
 *   · pinned footer (sync status · Settings · theme · Sign Out).
 *
 * Opened via the `compvss:nav-open` window event dispatched by the More tab in
 * `MobileTabBarClient` — the two are sibling client islands under a server
 * layout, so an event bus is the lightest coupling. The `/m/more` route stays
 * as the deep-linkable / no-JS fallback of the same `moreNavGroups` IA.
 */
export type MobileNavDrawerProps = {
  name: string;
  roleLabel: string;
  initials: string;
  orgName: string;
  projectName: string | null;
  projectLive: boolean;
  currentOrgId: string;
  currentProjectId: string | null;
  /** Manager+ — reveals the gated Manage control-plane group. */
  canManage: boolean;
  /** Live pending-approvals count for the Manage → Approvals badge. */
  approvals: number;
};

export function MobileNavDrawer({
  name,
  roleLabel,
  initials,
  orgName,
  projectName,
  projectLive,
  currentOrgId,
  currentProjectId,
  canManage,
  approvals,
}: MobileNavDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeIfAvailable();
  const [open, setOpen] = React.useState(false);
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  // Plain function — the React Compiler memoizes; a manual useCallback here
  // can't be preserved (setters are stable, so the closure is trivially safe).
  const close = () => {
    setOpen(false);
    setQ("");
  };

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("compvss:nav-open", onOpen);
    return () => window.removeEventListener("compvss:nav-open", onOpen);
  }, []);

  // Close on Escape while open (setters are stable, so no dep on `close`).
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQ("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const query = q.trim().toLowerCase();
  const match = (l: MoreNavLink) =>
    !query || l.label.toLowerCase().includes(query) || l.sub.toLowerCase().includes(query);

  const groups = moreNavGroups
    .map((g) => ({
      ...g,
      links: g.links.filter((l) => (!l.managerOnly || canManage) && match(l)),
    }))
    .filter((g) => g.links.length > 0);

  const badgeFor = (l: MoreNavLink) => (l.badge === "approvals" ? approvals : 0);

  if (!open) {
    // Keep the switcher instance mounted-on-demand only; nothing renders when
    // the drawer is closed (the tab-bar event re-opens it).
    return null;
  }

  return (
    <>
      <div className="navdrawer" role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" className="nav-scrim" aria-label="Close menu" onClick={close} />
        <div className="nav-panel">
          <div className="nav-head">
            <Link href="/m/profile" className="nav-id" onClick={close}>
              <span className="nav-av">{initials}</span>
              <span className="nav-id-t">
                <span className="nav-name">{name}</span>
                <span className="nav-role">{roleLabel}</span>
              </span>
              <KIcon name="ChevronRight" size={16} />
            </Link>
            <button
              type="button"
              className="nav-ctx"
              onClick={() => {
                setOpen(false);
                setSwitcherOpen(true);
              }}
            >
              <span className="nav-ctx-ic">
                <KIcon name="Building2" size={15} />
              </span>
              <span className="nav-ctx-t">
                <span className="nav-ctx-org">{orgName}</span>
                <span className="nav-ctx-proj">
                  {projectLive && <span className="live" />}
                  {projectName ?? "All Projects"}
                </span>
              </span>
              <KIcon name="ChevronsUpDown" size={14} />
            </button>
          </div>

          <div className="nav-search">
            <KIcon name="Search" size={15} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search menu…"
              aria-label="Search menu"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear">
                <KIcon name="X" size={14} />
              </button>
            )}
          </div>

          <div className="nav-body">
            {groups.map((g) => (
              <div className="nav-grp" key={g.key}>
                <div className="nav-grp-h">
                  {g.key === "manage" && (
                    <KIcon
                      name="ShieldCheck"
                      size={11}
                      style={{ marginRight: 5, verticalAlign: "-1px", color: "var(--p-accent-text)" }}
                    />
                  )}
                  {g.label}
                </div>
                {g.links.map((l) => {
                  const isOn = pathname === l.href || pathname?.startsWith(`${l.href}/`);
                  const count = badgeFor(l);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`nav-row${isOn ? " on" : ""}`}
                      onClick={close}
                    >
                      <span className="nav-row-ic">
                        <KIcon name={l.icon} size={17} />
                      </span>
                      <span className="nav-row-t">
                        <span className="nav-row-l">{l.label}</span>
                        <span className="nav-row-s">{l.sub}</span>
                      </span>
                      {count > 0 ? (
                        <span className="nav-badge">{count > 99 ? "99+" : count}</span>
                      ) : (
                        <KIcon
                          name="ChevronRight"
                          size={15}
                          style={{ color: "var(--p-text-3)", flex: "none" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
            {groups.length === 0 && (
              <div className="nav-empty">No destinations match “{q}”.</div>
            )}
          </div>

          <div className="nav-foot">
            <button
              type="button"
              className="nav-sync"
              onClick={() => {
                router.refresh();
              }}
            >
              <KIcon name="RefreshCw" size={15} style={{ color: "var(--p-success)" }} />
              Synced
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: "var(--p-mono)", fontSize: 10, color: "var(--p-text-3)" }}>
                TAP TO REFRESH
              </span>
            </button>
            <div className="nav-foot-actions">
              <Link href="/m/settings" className="nav-foot-btn" onClick={close}>
                <KIcon name="Settings" size={17} />
                <span>Settings</span>
              </Link>
              {theme && (
                <button
                  type="button"
                  className="nav-foot-btn"
                  onClick={() => theme.setMode(theme.mode === "dark" ? "light" : "dark")}
                >
                  <KIcon name={theme.mode === "dark" ? "Sun" : "Moon"} size={17} />
                  <span>{theme.mode === "dark" ? "Light" : "Dark"}</span>
                </button>
              )}
              <form method="post" action="/auth/signout" style={{ display: "contents" }}>
                <button type="submit" className="nav-foot-btn danger" style={{ width: "100%" }}>
                  <KIcon name="LogOut" size={17} />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <MobileSwitcherSheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        currentOrgId={currentOrgId}
        currentProjectId={currentProjectId}
      />
    </>
  );
}
