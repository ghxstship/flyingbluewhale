import Link from "next/link";
import type { ReactNode } from "react";
// Shell-split (perf, 2026-07-18): the LEG3ND signage token/anatomy layer
// (SignIcon / SignPanel) is consumed by the /legend signage library (and the
// portal's gvteway wayfinding). Off the core path now. Plus the App Rail chrome
// this shell mounts.
import "../theme/kit-signage.css";
import "../theme/kit-rail.css";
import { legendNav } from "@/lib/nav";
import { LegendSidebar } from "@/components/legend/LegendSidebar";
import { getSession } from "@/lib/auth";
import { AppRail } from "@/components/workspace-chrome/AppRail";
import { resolveAppRail } from "@/components/workspace-chrome/resolveAppRail";

/**
 * LEG3ND shell (ADR-0011) — the standalone Knowledge · LMS · resource hub,
 * promoted out of the console into its own route group + `legend` subdomain.
 *
 * Unlike the `(platform)` shell this layout does NOT blanket-gate on a session:
 * LEG3ND's public funnel (logged-out marketing + catalog + standard/course
 * previews + the institutions B2B capture) must render for anonymous visitors.
 * The org-scoped surfaces (engine / resources / the signage library, which is
 * an org's own sign register rather than public reference content) gate
 * themselves with `requireSession()` at the page level.
 *
 * `data-product="legend"` paints Production Orange; `data-type="legend"` swaps
 * in the airport-signage type axis — LEG3ND is the one surface that changes the
 * type family. Both sit on one element so the
 * `[data-ui="saas"][data-product="legend"]` token selectors resolve.
 */
export default async function LegendLayout({ children }: { children: ReactNode }) {
  // LEG3ND has a public funnel, so the rail only mounts for authenticated users
  // (rule 2: never on public surfaces) with ≥ 2 reachable apps.
  const session = await getSession();
  const rail = session
    ? await resolveAppRail({
        shell: "legend",
        userId: session.userId,
        role: session.role,
        persona: session.persona,
        isDeveloper: session.isDeveloper,
      })
    : null;

  return (
    <div
      data-ui="saas"
      data-theme="atlvs-product"
      data-product="legend"
      data-platform="legend"
      data-type="legend"
      className="flex min-h-screen bg-[var(--p-bg)] text-[var(--p-text-1)]"
    >
      {rail?.show ? <AppRail groups={rail.groups} activeId={rail.activeId} labels={rail.labels} /> : null}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--p-border)] bg-[var(--p-surface)]/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-6 px-6">
            <Link
              href="/legend"
              className="atlvs-wordmark text-lg font-semibold text-[var(--p-text-1)]"
              aria-label="LEG3ND home"
            >
              L E G 3 N D
            </Link>
            <Link
              href="/legend/profile"
              className="text-sm font-medium text-[var(--p-text-2)] transition-colors hover:text-[var(--p-text-1)]"
            >
              Profile
            </Link>
          </div>
        </header>
        <div className="flex flex-1 flex-col md:flex-row">
          <LegendSidebar groups={legendNav} />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
