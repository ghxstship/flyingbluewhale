import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  const SECTIONS = [
    {
      href: "/console/transport/dispatch",
      title: t("console.transport.sections.dispatch.title", undefined, "Dispatch"),
      body: t(
        "console.transport.sections.dispatch.body",
        undefined,
        "Live ground transport dispatch — runs, drivers, vehicles, ETAs.",
      ),
    },
    {
      href: "/console/transport/ad",
      title: t("console.transport.sections.ad.title", undefined, "Arrivals & Departures"),
      body: t(
        "console.transport.sections.ad.body",
        undefined,
        "A&D manifest, airport pickups, hotel returns, VIP hand-offs.",
      ),
    },
    {
      href: "/console/transport/workforce",
      title: t("console.transport.sections.workforce.title", undefined, "Workforce Shuttles"),
      body: t(
        "console.transport.sections.workforce.body",
        undefined,
        "Crew shuttle routes, schedules, capacity tracking.",
      ),
    },
    {
      href: "/console/transport/fleets",
      title: t("console.transport.sections.fleets.title", undefined, "Fleets"),
      body: t(
        "console.transport.sections.fleets.body",
        undefined,
        "Vehicle inventory, certifications, fuel + mileage logs.",
      ),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.eyebrow", undefined, "Logistics")}
        title={t("console.transport.title", undefined, "Transport")}
        subtitle={t(
          "console.transport.subtitle",
          undefined,
          "Dispatch, arrivals & departures, workforce shuttles, fleet management.",
        )}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{s.body}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                {t("common.open", undefined, "Open")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
