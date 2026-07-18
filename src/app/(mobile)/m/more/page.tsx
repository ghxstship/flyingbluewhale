import Link from "next/link";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon, RecentRail } from "@/components/mobile/kit";
import { InstallCard } from "@/components/mobile/InstallCard";
import { moreNavGroups } from "@/lib/nav";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · More — the deep-linkable / no-JS fallback of the nav drawer.
 *
 * Kit 33 v3.0 moves the primary "More" affordance to a left slide-in drawer
 * (`MobileNavDrawer`, opened by the More tab). This route stays as the
 * grouped-list fallback and renders from the SAME SSOT the drawer uses
 * (`moreNavGroups` in `src/lib/nav.ts`), so the two can never drift. Group
 * order + IA + gating are the kit's `NAV_GROUPS`: My Work · Workplace ·
 * Operations · People & Teams · Opportunities, then the perm-gated **Manage**
 * control plane (hidden for crew / external). Profile/Settings/Sign-Out live in
 * the drawer's identity header + footer, not here.
 */
export default async function MorePage() {
  const session = await requireSession();
  const canManage = isManagerPlus(session);
  const { t } = await getRequestT();

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.more.eyebrow", undefined, "Workspace")}</div>
      <h1 className="scr-h" style={{ marginBottom: 8 }}>
        {t("m.more.title", undefined, "More")}
      </h1>

      {/* Kit 32 C3 — jump back into the last records you opened. */}
      <RecentRail heading={t("m.more.recent", undefined, "Recently Viewed")} />

      {moreNavGroups.map((g, gi) => {
        const links = g.links.filter((l) => !l.managerOnly || canManage);
        if (!links.length) return null;
        return (
          <div key={g.key}>
            <div className="sech" style={{ marginTop: gi === 0 ? 8 : 22 }}>
              <h2>{t(`m.more.group.${g.key}`, undefined, g.label)}</h2>
            </div>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="item tap" style={{ textDecoration: "none" }}>
                <span className="more-ic">
                  <KIcon name={l.icon} size={18} />
                </span>
                <div>
                  <div className="t">{l.label}</div>
                  <div className="s">{l.sub}</div>
                </div>
                <span className="sp" />
                <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
              </Link>
            ))}
          </div>
        );
      })}

      {/* Kit 32 F5 — the A2HS install card (shown from the 2nd visit, once
          the shell beacon has counted; dismissible for good). */}
      <InstallCard />
    </div>
  );
}
