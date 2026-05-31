import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Operations" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/ops/toc">
            <div className="text-sm font-medium">TOC</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc/problems">
            <div className="text-sm font-medium">Problems</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc/changes">
            <div className="text-sm font-medium">Changes</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/settings/integrations">
            <div className="text-sm font-medium">Integrations</div>
          </Link>
          <Link className="surface hover-lift p-4 border-l-2 border-[var(--color-warning)]" href="/console/ops/alerts">
            <div className="text-sm font-medium">Operational Alerts</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Budget overruns · crew gaps · overdue work</div>
          </Link>
          <Link className="surface hover-lift p-4 border-l-2 border-[var(--org-primary)]" href="/console/assistant/ops">
            <div className="text-sm font-medium">Ops Health AI</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Ask questions about your operations in plain language</div>
          </Link>
        </div>
      </div>
    </>
  );
}
