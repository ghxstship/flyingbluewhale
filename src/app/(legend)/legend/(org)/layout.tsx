import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";

/**
 * (org) segment gate — the single auth boundary for LEG3ND's org-scoped
 * surfaces (hub, engine, resources, signage, teach, store, learning records,
 * community, compliance, console).
 *
 * The (legend) shell layout deliberately does NOT gate: the public funnel
 * lives in the sibling `(public)` group (catalog + course previews,
 * for-institutions, credential verification). Everything org-scoped sits
 * under this group so a new page is gated by construction instead of by
 * remembering to call requireSession() in the page — that convention had
 * already produced ungated create forms (hub/locations/new, hub/catalogs/new,
 * hub/templates/job-templates/new). Existing per-page requireSession calls
 * stay as defense-in-depth; RLS remains the data boundary either way.
 *
 * Anonymous visitors bounce to the auth shell with ?next= carrying the
 * internal path (requireSession reads x-pathname), so re-auth returns here.
 */
export default async function LegendOrgLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
