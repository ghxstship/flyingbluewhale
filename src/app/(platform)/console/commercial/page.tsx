import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";

const SECTIONS = [
  {
    href: "/console/commercial/sponsors",
    title: "Sponsors",
    body: "Sponsor entitlements, activations, brand assets, reporting, impressions.",
  },
  {
    href: "/console/commercial/hospitality",
    title: "Hospitality",
    body: "VIP package management, allocations, fulfillment.",
  },
  {
    href: "/console/commercial/tickets",
    title: "Ticketing",
    body: "Inventory, sales, transfers, gate scan integrations.",
  },
  {
    href: "/console/commercial/licensing",
    title: "Licensing",
    body: "Music sync, broadcast rights, performance licenses.",
  },
  {
    href: "/console/settings/branding",
    title: "Brand",
    body: "Logo, colors, custom domain, white-label posture.",
  },
];

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Commercial"
        title="Commercial"
        subtitle="Revenue surfaces — sponsors, ticketing, hospitality, licensing, brand."
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
