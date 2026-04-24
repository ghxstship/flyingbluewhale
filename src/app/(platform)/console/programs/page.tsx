import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Programs" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/programs/schedule"><div className="text-sm font-medium">Master schedule</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/risk"><div className="text-sm font-medium">Risk register</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/reviews"><div className="text-sm font-medium">Reviews</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/readiness"><div className="text-sm font-medium">Readiness</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/scope"><div className="text-sm font-medium">Scope</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/sessions"><div className="text-sm font-medium">Sessions</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/ceremonies"><div className="text-sm font-medium">Ceremonies</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/protocol"><div className="text-sm font-medium">Protocol</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/pressconf"><div className="text-sm font-medium">Press conferences</div></a>
          <a className="surface hover-lift p-4" href="/console/programs/cases"><div className="text-sm font-medium">Cases</div></a>
        </div>
      </div>
    </>
  );
}
