import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

const TEMPLATES = [
  { title: "Proposal response", desc: "Generate a client proposal from a deal brief" },
  { title: "Artist rider", desc: "Draft a technical + hospitality rider" },
  { title: "Call sheet", desc: "Compose a day-of call sheet with crew and logistics" },
  { title: "Invoice note", desc: "Write a polite follow-up on an outstanding invoice" },
  { title: "Safety briefing", desc: "Summarize site-specific hazards" },
  { title: "Event recap", desc: "Post-event wrap for clients" },
];

export default function DraftingPage() {
  return (
    <>
      <ModuleHeader eyebrow="AI" title="Drafting" subtitle="Kick off from a template or paste raw notes" />
      <div className="page-content space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <Link key={t.title} href="/console/ai/assistant" className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.title}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
