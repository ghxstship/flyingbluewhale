import Link from "next/link";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · More — the LinkedIn-style hub of secondary surfaces.
 *
 * Server component. Mirrors the prototype's `tab==="more"` render: a grouped
 * module list (Tools · People · Network · Account) of `.item` rows linking to
 * the secondary routes. The group structure + ordering follow the kit's
 * MORE_LINKS grouping; each row carries an icon + short sublabel. The
 * Approvals row is manager-gated (hidden for members; the route re-checks).
 */

type MoreLink = {
  href: string;
  icon: string;
  labelKey: string;
  label: string;
  subKey: string;
  sub: string;
  /** Manager+ only (hiding is UX; the surface re-checks server-side). */
  managerOnly?: boolean;
};

type Group = { key: string; label: string; links: MoreLink[] };

export default async function MorePage() {
  const session = await requireSession();
  const canApprove = isManagerPlus(session);
  const { t } = await getRequestT();

  const groups: Group[] = [
    {
      key: "tools",
      label: t("m.more.tools", undefined, "Tools"),
      links: [
        { href: "/m/clock", icon: "Timer", labelKey: "m.more.time", label: "Time", subKey: "m.more.timeSub", sub: "Your Hours & Shift Records" },
        { href: "/m/requests", icon: "CheckCheck", labelKey: "m.more.approvals", label: "Approvals", subKey: "m.more.approvalsSub", sub: "Review & Action Requests", managerOnly: true },
        { href: "/m/docs", icon: "FolderOpen", labelKey: "m.more.documents", label: "Documents", subKey: "m.more.documentsSub", sub: "Site Docs, Filtered To You" },
        { href: "/m/inventory", icon: "PackageSearch", labelKey: "m.more.inventory", label: "Inventory", subKey: "m.more.inventorySub", sub: "On-Hand Gear & Stock" },
        { href: "/m/catalog", icon: "Boxes", labelKey: "m.more.catalog", label: "Catalog", subKey: "m.more.catalogSub", sub: "Browse & Request From XPMS" },
      ],
    },
    {
      key: "people",
      label: t("m.more.people", undefined, "People"),
      links: [
        { href: "/m/directory", icon: "Users", labelKey: "m.more.roster", label: "Team Roster", subKey: "m.more.rosterSub", sub: "Org & Project Crew" },
        { href: "/m/directory/companies", icon: "Building2", labelKey: "m.more.vendors", label: "Vendors", subKey: "m.more.vendorsSub", sub: "All Orgs On This Project" },
        { href: "/m/connections", icon: "Network", labelKey: "m.more.connections", label: "Connections", subKey: "m.more.connectionsSub", sub: "Your ATLVS Network" },
      ],
    },
    {
      key: "network",
      label: t("m.more.network", undefined, "Network"),
      links: [
        { href: "/m/feed", icon: "Megaphone", labelKey: "m.more.community", label: "Community", subKey: "m.more.communitySub", sub: "Your Professional Feed" },
        { href: "/m/gigs", icon: "Briefcase", labelKey: "m.more.jobs", label: "Jobs", subKey: "m.more.jobsSub", sub: "Open Shifts & Gigs" },
        { href: "/m/market", icon: "Tag", labelKey: "m.more.market", label: "Marketplace", subKey: "m.more.marketSub", sub: "Buy, Sell & Trade Gear" },
      ],
    },
    {
      key: "account",
      label: t("m.more.account", undefined, "Account"),
      links: [
        { href: "/m/profile", icon: "User", labelKey: "m.more.profile", label: "Profile", subKey: "m.more.profileSub", sub: "Your Badges, Reviews & EPK" },
        { href: "/m/activity", icon: "History", labelKey: "m.more.activity", label: "Activity History", subKey: "m.more.activitySub", sub: "Scans, Access, Reports & More" },
        { href: "/m/referrals", icon: "Gift", labelKey: "m.more.referrals", label: "Referrals & Rewards", subKey: "m.more.referralsSub", sub: "Refer Crew, Earn Rewards" },
        { href: "/m/settings", icon: "Settings", labelKey: "m.more.settings", label: "Settings", subKey: "m.more.settingsSub", sub: "App Preferences" },
      ],
    },
  ];

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.more.eyebrow", undefined, "Workspace")}</div>
      <h1 className="scr-h" style={{ marginBottom: 8 }}>
        {t("m.more.title", undefined, "More")}
      </h1>

      {groups.map((g) => {
        const links = g.links.filter((l) => !l.managerOnly || canApprove);
        if (!links.length) return null;
        return (
          <div key={g.key}>
            <div className="sech" style={{ marginTop: g.key === "tools" ? 8 : 22 }}>
              <h2>{g.label}</h2>
            </div>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="item tap" style={{ textDecoration: "none" }}>
                <span className="more-ic">
                  <KIcon name={l.icon} size={18} />
                </span>
                <div>
                  <div className="t">{t(l.labelKey, undefined, l.label)}</div>
                  <div className="s">{t(l.subKey, undefined, l.sub)}</div>
                </div>
                <span className="sp" />
                <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}
