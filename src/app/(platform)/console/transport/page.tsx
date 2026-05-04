import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";

const SECTIONS = [
  {
    href: "/console/transport/dispatch",
    title: "Dispatch",
    body: "Live ground transport dispatch — runs, drivers, vehicles, ETAs.",
  },
  {
    href: "/console/transport/ad",
    title: "Arrivals & Departures",
    body: "A&D manifest, airport pickups, hotel returns, VIP hand-offs.",
  },
  {
    href: "/console/transport/workforce",
    title: "Workforce Shuttles",
    body: "Crew shuttle routes, schedules, capacity tracking.",
  },
  {
    href: "/console/transport/fleets",
    title: "Fleets",
    body: "Vehicle inventory, certifications, fuel + mileage logs.",
  },
];

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Logistics"
        title="Transport"
        subtitle="Dispatch, arrivals & departures, workforce shuttles, fleet management."
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">{s.body}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Open <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
