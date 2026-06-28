import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  HardHat,
  Globe,
  GraduationCap,
  Mic2,
  Package,
  Wallet,
  Users,
  Utensils,
  Share2,
  Mail,
  type LucideIcon,
} from "lucide-react";
import type { AppId, Access } from "@/lib/entitlements";

/**
 * Global App Rail (ATLVS Ecosystem kit) — persistent cross-product switcher.
 *
 * A 74px vertical rail pinned to the left edge of the authenticated console.
 * Products (ATLVS · COMPVSS · GVTEWAY · LEG3ND) are live links; the seven
 * extensions render "coming soon" (inert) until their surfaces ship. The
 * active product is `aria-current="page"`. Read-only reach shows a small dot.
 *
 * Server component: `next/link` client-navigates same-origin paths and falls
 * back to a plain anchor for cross-origin (subdomain) hops. The entitled-app
 * list + active id + gate are resolved server-side by the shell layout via
 * `src/lib/entitlements.ts` (fed by `GET /v1/me/entitlements`). Styling:
 * `src/app/theme/kit-rail.css`.
 */
const ICONS: Record<AppId, LucideIcon> = {
  atlvs: LayoutDashboard,
  compvss: HardHat,
  gvteway: Globe,
  legend: GraduationCap,
  opvs: Mic2,
  cvrgo: Package,
  vault: Wallet,
  mvnifest: Users,
  gvlley: Utensils,
  social: Share2,
  email: Mail,
};

export type RailItem = {
  id: AppId;
  name: string;
  access: Access | null;
  comingSoon: boolean;
  href: string | null;
};

export type RailGroup = { label: string; items: RailItem[] };

export type AppRailLabels = {
  /** Accessible name for the rail landmark. */
  nav: string;
  /** Suffix for read-only items ("read-only"). */
  readOnly: string;
  /** Tag under coming-soon items ("Soon"). */
  soon: string;
};

function RailIcon({ id }: { id: AppId }) {
  const Icon = ICONS[id];
  return <Icon size={19} strokeWidth={2} aria-hidden="true" />;
}

export function AppRail({
  groups,
  activeId,
  labels,
}: {
  groups: RailGroup[];
  activeId: AppId | null;
  labels: AppRailLabels;
}) {
  // Render nothing if there's nothing to show (the layout also gates on the
  // reachable-app count, but this keeps the component safe in isolation).
  if (!groups.some((g) => g.items.length)) return null;

  return (
    <nav className="app-rail" aria-label={labels.nav}>
      {groups
        .filter((g) => g.items.length)
        .map((group, gi) => (
          <React.Fragment key={group.label}>
            {gi > 0 ? <div className="app-rail__divider" aria-hidden="true" /> : null}
            <div className="app-rail__group" role="group" aria-label={group.label}>
              {group.items.map((item) => {
                if (item.comingSoon || !item.href) {
                  return (
                    <div
                      key={item.id}
                      className="app-rail__item app-rail__item--soon"
                      aria-disabled="true"
                      title={`${item.name} — ${labels.soon}`}
                    >
                      <RailIcon id={item.id} />
                      <span className="app-rail__soon-tag">{labels.soon}</span>
                    </div>
                  );
                }
                const active = item.id === activeId;
                const ro = item.access === "ro";
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="app-rail__item"
                    aria-current={active ? "page" : undefined}
                    aria-label={ro ? `${item.name} (${labels.readOnly})` : item.name}
                    title={ro ? `${item.name} — ${labels.readOnly}` : item.name}
                  >
                    {ro ? <span className="app-rail__ro" aria-hidden="true" /> : null}
                    <RailIcon id={item.id} />
                    <span className="app-rail__label">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </React.Fragment>
        ))}
    </nav>
  );
}
