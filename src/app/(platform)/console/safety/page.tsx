import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Safety & Incidents" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/safety/threats"><div className="text-sm font-medium">Threats</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/playbooks"><div className="text-sm font-medium">Playbooks</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/guard-tours"><div className="text-sm font-medium">Guard tours</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/incidents"><div className="text-sm font-medium">Incidents</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/major-incident"><div className="text-sm font-medium">Major incident</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/cyber-ir"><div className="text-sm font-medium">Cyber IR</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/medical/plan"><div className="text-sm font-medium">Medical plan</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/medical/encounters"><div className="text-sm font-medium">Medical encounters</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/environmental"><div className="text-sm font-medium">Environmental</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/crisis"><div className="text-sm font-medium">Crisis comms</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/safeguarding"><div className="text-sm font-medium">Safeguarding</div></a>
          <a className="surface hover-lift p-4" href="/console/safety/bcdr"><div className="text-sm font-medium">BC/DR</div></a>
        </div>
      </div>
    </>
  );
}
