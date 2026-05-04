import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";

const SECTIONS = [
  {
    href: "/console/participants/delegations",
    title: "Delegations",
    body: "Country / org delegations — head of mission, registered party, accreditations.",
  },
  {
    href: "/console/participants/entries",
    title: "Entries",
    body: "Athlete / competitor entries by event, with category + bib management.",
  },
  {
    href: "/console/participants/visa",
    title: "Visa",
    body: "Visa workflow — invitation letters, application status, embassy correspondence.",
  },
];

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Participants"
        subtitle="Delegation registration, athlete entries, visa workflow."
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
