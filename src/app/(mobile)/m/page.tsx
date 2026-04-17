import Link from "next/link";

export default function MobileHome() {
  const tiles = [
    { href: "/m/check-in", label: "Check-in", sub: "Scan tickets" },
    { href: "/m/tasks", label: "Tasks", sub: "Today's queue" },
    { href: "/m/crew/clock", label: "Clock", sub: "In / out" },
    { href: "/m/inventory/scan", label: "Inventory", sub: "Equipment scan" },
    { href: "/m/incidents/new", label: "Incident", sub: "Safety report" },
    { href: "/m/settings", label: "Settings", sub: "Offline, perms" },
  ];
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">Field</div>
      <h1 className="mt-2 text-display text-3xl">Today</h1>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="card p-4">
            <div className="text-label">{t.label}</div>
            <div className="mt-1 text-mono text-xs text-[var(--color-text-tertiary)]">{t.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
