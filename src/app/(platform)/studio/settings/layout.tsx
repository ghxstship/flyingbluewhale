import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { settingsNav, type NavItem } from "@/lib/nav";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { SettingsSidebar } from "./SettingsSidebar";

/** Mirrors ROLE_RANK in src/lib/nav.ts#filterNavByRole — owner/admin top tier. */
const ROLE_RANK: Record<string, number> = { owner: 3, admin: 3, manager: 2 };
const RANK_BY_MIN_ROLE = { admin: 3, manager: 2 } as const;

/**
 * REC-16 / SC-5 — resolve the minimum role for the current settings path by
 * mirroring `filterNavByRole` semantics: the longest-prefix `settingsNav`
 * item wins; `minRole` unset means open to every member. Settings paths
 * that aren't in `settingsNav` at all default to the manager floor —
 * unlisted settings surfaces are org-config tools, not member workflows.
 */
function requiredRankFor(path: string): number {
  // The settings index stays open — members hold a handful of ungated
  // entries (Time-Clock Zones et al.) and need the landing page + sidebar.
  if (path === "/studio/settings" || path === "/studio/settings/") return 1;
  let match: NavItem | null = null;
  for (const group of settingsNav) {
    const items = [...group.items, ...(group.sections?.flatMap((s) => s.items) ?? [])];
    for (const item of items) {
      if (path === item.href || path.startsWith(`${item.href}/`)) {
        if (!match || item.href.length > match.href.length) match = item;
      }
    }
  }
  if (match) return match.minRole ? RANK_BY_MIN_ROLE[match.minRole] : 1;
  return RANK_BY_MIN_ROLE.manager;
}

/**
 * Settings is admin, not everyday work — it gets its own 2-col area separate
 * from the primary console sidebar. See `docs/ia/03-ia-compression-proposal.md`.
 * The primary sidebar stays mounted via `(platform)/layout.tsx`; this layout
 * only shapes the inner content. The session role feeds the sidebar's
 * role filter AND the server-side page gate below: entries hidden from the
 * sidebar are now also denied at render time instead of showing misleading
 * empty states (REC-16 / SC-5).
 */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session?.role ?? null;

  let denied: "Admin" | "Manager" | null = null;
  if (hasSupabase) {
    // x-pathname is injected by src/proxy.ts; when absent (e.g. unit render
    // without the proxy) skip the gate — pages keep their own checks.
    const h = await headers();
    const path = h.get("x-pathname");
    if (path && path.startsWith("/studio/settings")) {
      const needed = requiredRankFor(path);
      const rank = ROLE_RANK[role ?? ""] ?? 1;
      if (rank < needed) denied = needed >= 3 ? "Admin" : "Manager";
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col gap-0 md:flex-row">
      <SettingsSidebar role={role} />
      <div className="min-w-0 flex-1">
        {denied ? <AccessDenied requiredRole={denied} backHref="/studio" /> : children}
      </div>
    </div>
  );
}
