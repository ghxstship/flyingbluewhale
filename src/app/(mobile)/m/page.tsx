import { QrCode } from "lucide-react";
import { FAB } from "@/components/mobile/FAB";
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
export default function MobileHome() {
  const today = [
    { href: "/m/check-in", label: "Check-in", sub: "Scan tickets" },
    { href: "/m/tasks", label: "Tasks", sub: "Today's queue" },
    { href: "/m/crew/clock", label: "Clock", sub: "In / out" },
    { href: "/m/inventory/scan", label: "Inventory", sub: "Equipment scan" },
    { href: "/m/incidents/new", label: "Incident", sub: "Safety report" },
    { href: "/m/settings", label: "Settings", sub: "Offline, perms" },
  ];

  const tools = [
    { href: "/m/gate", label: "Gate Scan", sub: "Door check-in" },
    { href: "/m/wallet", label: "Wallet", sub: "Pass + payouts" },
    { href: "/m/wms", label: "Warehouse", sub: "Stock moves" },
    { href: "/m/driver", label: "Driver", sub: "Run sheet" },
    { href: "/m/ad", label: "A&D", sub: "Arrival / departure" },
    { href: "/m/ros", label: "Run of Show", sub: "Cue-by-cue" },
    { href: "/m/guard", label: "Guard", sub: "Patrol log" },
    { href: "/m/safeguarding", label: "Safeguarding", sub: "Welfare" },
    { href: "/m/medic", label: "Medic", sub: "Patient log" },
    { href: "/m/coc", label: "Chain of Custody", sub: "Asset trail" },
    { href: "/m/handover", label: "Handover", sub: "Shift transfer" },
    { href: "/m/wayfind", label: "Wayfind", sub: "Site map" },
    { href: "/m/gigs", label: "Open Gigs", sub: "Find next work" },
  ];

  const reports = [
    { href: "/m/daily-log", label: "Daily Log", sub: "Today's entries" },
    { href: "/m/punch", label: "Punch List", sub: "Open items" },
    { href: "/m/incidents", label: "Incidents", sub: "All reports" },
    { href: "/m/requests", label: "Requests", sub: "Service desk" },
    { href: "/m/notifications", label: "Notifications", sub: "All alerts" },
  ];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">Field</div>
      <h1 className="text-display mt-2 text-3xl">Today</h1>
      <MobileHomeTabs today={today} tools={tools} reports={reports} />
      <FAB href="/m/check-in" label="Scan Ticket">
        <QrCode size={22} />
      </FAB>
    </div>
  );
}
