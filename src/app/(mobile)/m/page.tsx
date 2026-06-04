import { QrCode } from "lucide-react";
import { FAB } from "@/components/mobile/FAB";
import { getRequestT } from "@/lib/i18n/request";
import { MobileHomeTabs } from "./MobileHomeTabs";

/**
 * Mobile home — three-tab section (Today / Tools / Reports) replacing the
 * single 6-tile grid. Phase D of the WAYFINDER remediation: 17 mobile
 * routes were reachable only by deep link before; the Tools tab gives
 * every surface a tappable home and the cmd-K palette indexes the same
 * registry so keyboard-driven discovery matches.
 *
 * iOS HIG / Apple Maps pattern — five bottom-tab surfaces with section
 * grouping inside the active tab. Hick's-Law-respecting (6 primary tiles,
 * then scoped sub-grids on demand).
 */
export default async function MobileHome() {
  const { t } = await getRequestT();
  const today = [
    {
      href: "/m/check-in",
      label: t("m.home.today.checkIn.label", undefined, "Check-in"),
      sub: t("m.home.today.checkIn.sub", undefined, "Scan tickets"),
    },
    {
      href: "/m/tasks",
      label: t("m.home.today.tasks.label", undefined, "Tasks"),
      sub: t("m.home.today.tasks.sub", undefined, "Today's queue"),
    },
    {
      href: "/m/crew/clock",
      label: t("m.home.today.clock.label", undefined, "Clock"),
      sub: t("m.home.today.clock.sub", undefined, "In / out"),
    },
    {
      href: "/m/inventory/scan",
      label: t("m.home.today.inventory.label", undefined, "Inventory"),
      sub: t("m.home.today.inventory.sub", undefined, "Equipment scan"),
    },
    {
      href: "/m/incidents/new",
      label: t("m.home.today.incident.label", undefined, "Incident"),
      sub: t("m.home.today.incident.sub", undefined, "Safety report"),
    },
    {
      href: "/m/settings",
      label: t("m.home.today.settings.label", undefined, "Settings"),
      sub: t("m.home.today.settings.sub", undefined, "Offline, perms"),
    },
  ];

  const tools = [
    {
      href: "/m/gate",
      label: t("m.home.tools.gate.label", undefined, "Gate Scan"),
      sub: t("m.home.tools.gate.sub", undefined, "Door check-in"),
    },
    {
      href: "/m/wallet",
      label: t("m.home.tools.wallet.label", undefined, "Wallet"),
      sub: t("m.home.tools.wallet.sub", undefined, "Pass + payouts"),
    },
    {
      href: "/m/wms",
      label: t("m.home.tools.wms.label", undefined, "Warehouse"),
      sub: t("m.home.tools.wms.sub", undefined, "Stock moves"),
    },
    {
      href: "/m/driver",
      label: t("m.home.tools.driver.label", undefined, "Driver"),
      sub: t("m.home.tools.driver.sub", undefined, "Run sheet"),
    },
    {
      href: "/m/ad",
      label: t("m.home.tools.ad.label", undefined, "A&D"),
      sub: t("m.home.tools.ad.sub", undefined, "Arrival / departure"),
    },
    {
      href: "/m/ros",
      label: t("m.home.tools.ros.label", undefined, "Run of Show"),
      sub: t("m.home.tools.ros.sub", undefined, "Cue-by-cue"),
    },
    {
      href: "/m/guard",
      label: t("m.home.tools.guard.label", undefined, "Guard"),
      sub: t("m.home.tools.guard.sub", undefined, "Patrol log"),
    },
    {
      href: "/m/safeguarding",
      label: t("m.home.tools.safeguarding.label", undefined, "Safeguarding"),
      sub: t("m.home.tools.safeguarding.sub", undefined, "Welfare"),
    },
    {
      href: "/m/medic",
      label: t("m.home.tools.medic.label", undefined, "Medic"),
      sub: t("m.home.tools.medic.sub", undefined, "Patient log"),
    },
    {
      href: "/m/coc",
      label: t("m.home.tools.coc.label", undefined, "Chain of Custody"),
      sub: t("m.home.tools.coc.sub", undefined, "Asset trail"),
    },
    {
      href: "/m/handover",
      label: t("m.home.tools.handover.label", undefined, "Handover"),
      sub: t("m.home.tools.handover.sub", undefined, "Shift transfer"),
    },
    {
      href: "/m/wayfind",
      label: t("m.home.tools.wayfind.label", undefined, "Wayfind"),
      sub: t("m.home.tools.wayfind.sub", undefined, "Site map"),
    },
    {
      href: "/m/gigs",
      label: t("m.home.tools.gigs.label", undefined, "Open Gigs"),
      sub: t("m.home.tools.gigs.sub", undefined, "Find next work"),
    },
  ];

  const reports = [
    {
      href: "/m/daily-log",
      label: t("m.home.reports.dailyLog.label", undefined, "Daily Log"),
      sub: t("m.home.reports.dailyLog.sub", undefined, "Today's entries"),
    },
    {
      href: "/m/punch",
      label: t("m.home.reports.punch.label", undefined, "Punch List"),
      sub: t("m.home.reports.punch.sub", undefined, "Open items"),
    },
    {
      href: "/m/incidents",
      label: t("m.home.reports.incidents.label", undefined, "Incidents"),
      sub: t("m.home.reports.incidents.sub", undefined, "All reports"),
    },
    {
      href: "/m/requests",
      label: t("m.home.reports.requests.label", undefined, "Requests"),
      sub: t("m.home.reports.requests.sub", undefined, "Service desk"),
    },
    {
      href: "/m/notifications",
      label: t("m.home.reports.notifications.label", undefined, "Notifications"),
      sub: t("m.home.reports.notifications.sub", undefined, "All alerts"),
    },
  ];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">{t("m.home.eyebrow", undefined, "Field")}</div>
      <h1 className="text-display mt-2 text-3xl">{t("m.home.title", undefined, "Today")}</h1>
      <MobileHomeTabs today={today} tools={tools} reports={reports} />
      <FAB href="/m/check-in" label={t("m.home.fab.scanTicket", undefined, "Scan Ticket")}>
        <QrCode size={22} />
      </FAB>
    </div>
  );
}
