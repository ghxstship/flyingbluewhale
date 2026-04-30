import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Operations" title="Operations" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/operations/dispatch">
            <div className="text-sm font-medium">Dispatch matrix</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Today across crews + venues + vehicles</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/operations/maintenance">
            <div className="text-sm font-medium">Maintenance</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">PPM + cred-renewal queue</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/operations/incidents">
            <div className="text-sm font-medium">Incidents</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/services/requests">
            <div className="text-sm font-medium">Service requests</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Triage with SLAs</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/ops/toc">
            <div className="text-sm font-medium">TOC (ITIL)</div>
          </Link>
          <Link className="surface hover-lift p-4" href="/console/safety/incidents">
            <div className="text-sm font-medium">Safety incidents</div>
          </Link>
        </div>
      </div>
    </>
  );
}
