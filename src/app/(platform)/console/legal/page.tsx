import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";

const SECTIONS = [
  {
    href: "/console/legal/ip",
    title: "Intellectual Property",
    body: "Trademark, copyright, music sync, image releases.",
  },
  {
    href: "/console/legal/privacy",
    title: "Privacy",
    body: "Privacy policy register, breach response, data inventories.",
  },
  {
    href: "/console/legal/privacy/dsar",
    title: "DSAR Requests",
    body: "Data subject access requests — intake, fulfillment, audit trail.",
  },
  {
    href: "/console/legal/privacy/consent",
    title: "Consent",
    body: "Consent receipts, withdrawal, version history.",
  },
  {
    href: "/console/legal/privacy/datamap",
    title: "Data Map",
    body: "What data we hold, where, who can see it, how long it's retained.",
  },
  {
    href: "/console/legal/insurance",
    title: "Insurance",
    body: "GL, workers' comp, event cancellation, COIs.",
  },
];

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Legal" title="Legal" subtitle="IP, privacy, DSAR, consent, data map, insurance." />
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
