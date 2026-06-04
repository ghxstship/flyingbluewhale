import { notFound } from "next/navigation";
import { MOBILE_ROLES, type MobileRole } from "@/lib/nav";

/**
 * Role validation gate (ADR-0009 URL flip).
 *
 * Every `/m/[role]/...` request passes through this layout. Unknown
 * `[role]` segments 404 at the layout level (HTTP 404 not 200) so the
 * dynamic route can't be enumerated with arbitrary string segments.
 * Known roles fall through to the per-surface page, which is either
 * the role home (`/m/[role]/page.tsx`) or one of the universal
 * surface re-exports (inbox, shift, alerts, settings, feed, kudos,
 * learning, time-off, docs, directory).
 */
export default async function RoleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!MOBILE_ROLES.includes(role as MobileRole)) notFound();
  return <>{children}</>;
}
