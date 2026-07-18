"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronsUpDown, Search, Bell, Sparkles } from "lucide-react";
import { MobileSwitcherSheet } from "./MobileSwitcherSheet";

/**
 * COMPVSS app bar — kit 28 `.appbar`
 * (design_handoff_compvss_field/runtime/app.jsx:1778).
 *
 * The mobile shell was rendering `WorkspaceChrome`, which is the *console's*
 * header: a different structure, different controls, and no COMPVSS context
 * row at all. The kit's bar is five things in one line:
 *
 *   brand mark (opens Aurora AI · ATLVS field intelligence) · org + project switcher · spacer ·
 *   search · bell (unread) · avatar (profile)
 *
 * The brand mark is the kit's own SVG — an accent rounded-rect with a white
 * eight-point star — not the ATLVS wordmark. It carries a Sparkles pip because
 * it is the AI entry point, which is why it is a button and not a logo.
 */
export type MobileAppBarProps = {
  orgName: string;
  projectName: string | null;
  projectLive: boolean;
  initials: string;
  unread: number;
  currentOrgId: string;
  currentProjectId: string | null;
};

export function MobileAppBar({
  orgName,
  projectName,
  projectLive,
  initials,
  unread,
  currentOrgId,
  currentProjectId,
}: MobileAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const onIdentity = pathname === "/m/profile" || pathname.startsWith("/m/settings");

  return (
    <>
      <div className="appbar">
        {/* Brand mark = the Aurora AI entry point (kit 31: `.brandbtn` → "Ask Aurora AI"). */}
        <button
          type="button"
          className="brandbtn"
          onClick={() => router.push("/m/aurora")}
          aria-label="Ask Aurora AI"
        >
          <svg viewBox="0 0 128 128" style={{ width: 30, height: 30 }} aria-hidden="true">
            <rect width="128" height="128" rx="28" fill="var(--p-accent)" />
            <g transform="translate(28 28) scale(1.125)">
              <path d="M32 5 L37 27 L59 32 L37 37 L32 59 L27 37 L5 32 L27 27 Z" fill="#fff" />
              <circle cx="32" cy="32" r="4.2" fill="var(--p-accent)" />
            </g>
          </svg>
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 15,
              height: 15,
              borderRadius: "50%",
              background: "var(--p-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={11} style={{ color: "var(--p-accent-text)" }} />
          </span>
        </button>

        {/* Org + project context. Opens the switcher sheet. */}
        <button type="button" className="ctx" onClick={() => setSwitcherOpen(true)} aria-label="Switch workspace or project">
          <span style={{ minWidth: 0 }}>
            <span className="org">{orgName}</span>
            <span className="proj">
              {projectLive && <span className="live" />}
              {projectName ?? "All Projects"}
              <ChevronsUpDown size={11} />
            </span>
          </span>
        </button>

        <span className="sp" />

        {/* Kit 29: Global Search is a first-class route (/m/search) reached
            from the top bar — supersedes the kit-28 overlay drawer. */}
        <button type="button" className="iconbtn" onClick={() => router.push("/m/search")} aria-label="Search">
          <Search size={19} />
        </button>
        <button type="button" className="iconbtn" onClick={() => router.push("/m/notifications")} aria-label="Notifications">
          <Bell size={19} />
          {unread > 0 && <span className="dot">{unread > 99 ? "99+" : unread}</span>}
        </button>
        <button
          type="button"
          className="avatar"
          data-active={onIdentity ? true : undefined}
          onClick={() => router.push("/m/profile")}
          aria-label="Profile & settings"
        >
          {initials}
        </button>
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
