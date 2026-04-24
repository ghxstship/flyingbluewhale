import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Operations" title="Operations" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/operations/incidents"><div className="text-sm font-medium">Incidents</div></a>
          <a className="surface hover-lift p-4" href="/console/ops/toc"><div className="text-sm font-medium">TOC (ITIL)</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/incidents"><div className="text-sm font-medium">Safety incidents</div></a>
          <a className="surface hover-lift p-4" href="/console/integrations"><div className="text-sm font-medium">Integrations</div></a>
        </div>
      </div>
    </>
  );
}
