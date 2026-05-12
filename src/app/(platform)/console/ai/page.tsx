import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";

const SECTIONS = [
  {
    href: "/console/ai/automations",
    title: "Automations",
    body: "Domain-event triggers, scheduled jobs, webhook fan-out. The runtime dispatcher for everything reactive in the platform.",
  },
];

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="AI"
        subtitle="Automations and assistive workflows powered by Claude. The chat surface lives inline on each module (see the AI assistant in the sidebar)."
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
