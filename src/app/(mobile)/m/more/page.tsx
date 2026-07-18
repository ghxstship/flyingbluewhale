import Link from "next/link";
import { requireSession, isManagerPlus, isAdmin } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · More — the LinkedIn-style hub of secondary surfaces.
 *
 * Server component. Mirrors the prototype's `tab==="more"` render: a grouped
 * module list of `.item` rows linking to the secondary routes. Kit 31
 * (live-test resolution #19) fixes the groups to the kit's six —
 * Operations · Time & Work · Workplace · People · Opportunities · Account
 * (runtime/app.jsx:2586). Repo surfaces the kit hub doesn't carry are homed
 * in the nearest kit group (surface-set changes are separate kit items); each
 * row carries an icon + short sublabel. The Approvals row is manager-gated
 * (hidden for members; the route re-checks).
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
  /** Owner/admin only — same contract: hiding is UX, the surface re-checks. */
  adminOnly?: boolean;
};

type Group = { key: string; label: string; links: MoreLink[] };

export default async function MorePage() {
  const session = await requireSession();
  const canApprove = isManagerPlus(session);
  const canAdmin = isAdmin(session);
  const { t } = await getRequestT();

  const groups: Group[] = [
    {
      key: "operations",
      label: t("m.more.groupOperations", undefined, "Operations"),
      links: [
        { href: "/m/catalog", icon: "Boxes", labelKey: "m.more.catalog", label: "Catalog", subKey: "m.more.catalogSub", sub: "Browse & Request From XPMS" },
        { href: "/m/inventory", icon: "PackageSearch", labelKey: "m.more.inventory", label: "Inventory", subKey: "m.more.inventorySub", sub: "On-Hand Gear & Stock" },
        { href: "/m/documents", icon: "FolderOpen", labelKey: "m.more.documents", label: "Documents", subKey: "m.more.documentsSub", sub: "Site Docs, Filtered To You" },
        // Kit 31: Templates + Finance join the Operations group (resolution
        // #15/#23). Finance carries the kit's `approve` gate (manager band).
        { href: "/m/templates", icon: "LayoutTemplate", labelKey: "m.more.templates", label: "Templates", subKey: "m.more.templatesSub", sub: "Org & Project Template Library" },
        { href: "/m/finance", icon: "Banknote", labelKey: "m.more.finance", label: "Finance", subKey: "m.more.financeSub", sub: "Budget, POs & Coded Spend", managerOnly: true },
        { href: "/m/requests", icon: "CheckCheck", labelKey: "m.more.approvals", label: "Approvals", subKey: "m.more.approvalsSub", sub: "Review & Action Requests", managerOnly: true },
        { href: "/m/advances", icon: "ClipboardList", labelKey: "m.more.advances", label: "Advancing", subKey: "m.more.advancesSub", sub: "What You've Been Issued" },
        { href: "/m/requisitions", icon: "ShoppingCart", labelKey: "m.more.reqs", label: "Purchase Requests", subKey: "m.more.reqsSub", sub: "Ask The Org To Buy Something" },
        { href: "/m/coc", icon: "FileCheck", labelKey: "m.more.coc", label: "Chain of Custody", subKey: "m.more.cocSub", sub: "Asset Transfers, Signed" },
        { href: "/m/handover", icon: "ArrowLeftRight", labelKey: "m.more.handover", label: "Handover", subKey: "m.more.handoverSub", sub: "Shift Notes & Handoffs" },
        { href: "/m/daily-log", icon: "NotebookPen", labelKey: "m.more.dailyLog", label: "Daily Log", subKey: "m.more.dailyLogSub", sub: "Site Diary, Day By Day" },
        { href: "/m/punch", icon: "ClipboardCheck", labelKey: "m.more.punchList", label: "Punch List", subKey: "m.more.punchListSub", sub: "Inspection Items, Org Wide" },
        { href: "/m/check-in", icon: "ScanLine", labelKey: "m.more.checkIn", label: "Scan", subKey: "m.more.checkInSub", sub: "Check People In" },
        { href: "/m/scan", icon: "QrCode", labelKey: "m.more.quickScan", label: "Quick Scan", subKey: "m.more.quickScanSub", sub: "Scan Any Code" },
        { href: "/m/door", icon: "DoorOpen", labelKey: "m.more.door", label: "Door Scanner", subKey: "m.more.doorSub", sub: "Gate Admission" },
        { href: "/m/incidents", icon: "TriangleAlert", labelKey: "m.more.incidents", label: "Incidents", subKey: "m.more.incidentsSub", sub: "The Org Queue" },
        { href: "/m/incident", icon: "Flag", labelKey: "m.more.myIncidents", label: "My Incidents", subKey: "m.more.myIncidentsSub", sub: "Reports You Filed" },
        { href: "/m/lost-found", icon: "Search", labelKey: "m.more.lostFound", label: "Lost & Found", subKey: "m.more.lostFoundSub", sub: "Log A Found Or Missing Item" },
        { href: "/m/emergency", icon: "Siren", labelKey: "m.more.emergency", label: "Emergency", subKey: "m.more.emergencySub", sub: "Your Muster Card & Codes" },
      ],
    },
    {
      key: "timework",
      label: t("m.more.groupTimeWork", undefined, "Time & Work"),
      links: [
        { href: "/m/my-work", icon: "ListChecks", labelKey: "m.more.myWork", label: "My Work", subKey: "m.more.myWorkSub", sub: "What You Owe & What Waits On You" },
        // Kit 32 (v2.9): the Shift Scheduler field window. The kit gates it
        // on `assign`; the surface re-checks `schedule:write` server-side.
        { href: "/m/scheduler", icon: "CalendarCog", labelKey: "m.more.scheduler", label: "Shift Scheduler", subKey: "m.more.schedulerSub", sub: "Build & Publish Crew Shifts", managerOnly: true },
        { href: "/m/clock", icon: "Timer", labelKey: "m.more.clock", label: "Time Clock", subKey: "m.more.clockSub", sub: "Clock In, Out & Breaks" },
        { href: "/m/time", icon: "Timer", labelKey: "m.more.time", label: "Time", subKey: "m.more.timeSub", sub: "Your Hours & Shift Records" },
        { href: "/m/timesheets", icon: "Timer", labelKey: "m.more.timesheets", label: "Timesheets", subKey: "m.more.timesheetsSub", sub: "Turn Punches Into Pay" },
        { href: "/m/time-off", icon: "CalendarOff", labelKey: "m.more.timeOff", label: "Time Off", subKey: "m.more.timeOffSub", sub: "Requests & Balances" },
        { href: "/m/expenses", icon: "Receipt", labelKey: "m.more.expenses", label: "Expenses", subKey: "m.more.expensesSub", sub: "Shoot The Receipt, File It" },
        { href: "/m/mileage", icon: "Truck", labelKey: "m.more.mileage", label: "Mileage", subKey: "m.more.mileageSub", sub: "Log Drives For Reimbursement" },
        { href: "/m/activity", icon: "History", labelKey: "m.more.activity", label: "Activity History", subKey: "m.more.activitySub", sub: "Scans, Access, Reports & More" },
      ],
    },
    {
      key: "workplace",
      label: t("m.more.groupWorkplace", undefined, "Workplace"),
      links: [
        { href: "/m/feed", icon: "Megaphone", labelKey: "m.more.community", label: "Community", subKey: "m.more.communitySub", sub: "Your Professional Feed" },
        { href: "/m/spaces", icon: "Sparkles", labelKey: "m.more.spaces", label: "Spaces & Clubs", subKey: "m.more.spacesSub", sub: "Team, Trade, Location & Club Channels" },
        { href: "/m/docs", icon: "BookOpen", labelKey: "m.more.knowledge", label: "Knowledge", subKey: "m.more.knowledgeSub", sub: "SOPs & Policies, Must-Reads Flagged" },
        { href: "/m/guide", icon: "Atlas", labelKey: "m.more.guide", label: "Guide", subKey: "m.more.guideSub", sub: "Know Before You Go" },
        { href: "/m/engagement", icon: "TrendingUp", labelKey: "m.more.engagement", label: "Engagement", subKey: "m.more.engagementSub", sub: "Reach & Adoption Analytics", managerOnly: true },
      ],
    },
    {
      key: "people",
      label: t("m.more.groupPeople", undefined, "People"),
      links: [
        { href: "/m/directory", icon: "Users", labelKey: "m.more.roster", label: "Team Roster", subKey: "m.more.rosterSub", sub: "Org & Project Crew" },
        { href: "/m/companies", icon: "Building2", labelKey: "m.more.vendors", label: "Vendors", subKey: "m.more.vendorsSub", sub: "All Orgs On This Project" },
        { href: "/m/connections", icon: "Network", labelKey: "m.more.connections", label: "Connections", subKey: "m.more.connectionsSub", sub: "Your ATLVS Network" },
        { href: "/m/onboarding", icon: "UserCheck", labelKey: "m.more.onboarding", label: "Onboarding", subKey: "m.more.onboardingSub", sub: "Finish Getting Set Up" },
      ],
    },
    {
      key: "opportunities",
      label: t("m.more.groupOpportunities", undefined, "Opportunities"),
      links: [
        { href: "/m/jobs", icon: "Briefcase", labelKey: "m.more.jobs", label: "Jobs", subKey: "m.more.jobsSub", sub: "Open Shifts & Gigs" },
        { href: "/m/market", icon: "Tag", labelKey: "m.more.market", label: "Marketplace", subKey: "m.more.marketSub", sub: "Buy, Sell & Trade Gear" },
        { href: "/m/referrals", icon: "Gift", labelKey: "m.more.referrals", label: "Referrals & Rewards", subKey: "m.more.referralsSub", sub: "Refer Crew, Earn Rewards" },
      ],
    },
    {
      key: "account",
      label: t("m.more.groupAccount", undefined, "Account"),
      links: [
        { href: "/m/profile", icon: "User", labelKey: "m.more.profile", label: "Profile", subKey: "m.more.profileSub", sub: "Your Badges, Reviews & EPK" },
        { href: "/m/pass", icon: "ShieldCheck", labelKey: "m.more.pass", label: "The Rose", subKey: "m.more.passSub", sub: "Your Credential & Access" },
        { href: "/m/settings/team", icon: "UserCog", labelKey: "m.more.team", label: "Team", subKey: "m.more.teamSub", sub: "Invite People & Change Roles", adminOnly: true },
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
        const links = g.links.filter((l) => (!l.managerOnly || canApprove) && (!l.adminOnly || canAdmin));
        if (!links.length) return null;
        return (
          <div key={g.key}>
            <div className="sech" style={{ marginTop: g.key === "operations" ? 8 : 22 }}>
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
