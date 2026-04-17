import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

const TILES = [
  { href: "/console/ai/assistant", label: "Assistant", desc: "Streaming chat across your workspace" },
  { href: "/console/ai/drafting", label: "Drafting", desc: "Generate proposals, riders, and comms" },
  { href: "/console/ai/automations", label: "Automations", desc: "Rule-based triggers and webhooks" },
  { href: "/console/ai/agents", label: "Agents", desc: "Long-running managed agents" },
];

export default function AIHub() {
  return (
    <>
      <ModuleHeader eyebrow="AI" title="AI hub" subtitle="Anthropic-powered tools across your operations" />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((t) => (
            <Link key={t.href} href={t.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t.label}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
