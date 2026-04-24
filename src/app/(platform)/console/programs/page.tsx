import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Programs" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/programs/schedule"><div className="text-sm font-medium">Master schedule</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/risk"><div className="text-sm font-medium">Risk register</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/reviews"><div className="text-sm font-medium">Reviews</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/readiness"><div className="text-sm font-medium">Readiness</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/scope"><div className="text-sm font-medium">Scope</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/sessions"><div className="text-sm font-medium">Sessions</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/ceremonies"><div className="text-sm font-medium">Ceremonies</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/protocol"><div className="text-sm font-medium">Protocol</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/pressconf"><div className="text-sm font-medium">Press conferences</div></Link>
          <Link className="surface hover-lift p-4" href="/console/programs/cases"><div className="text-sm font-medium">Cases</div></Link>
        </div>
      </div>
    </>
  );
}
