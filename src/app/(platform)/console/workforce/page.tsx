import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Workforce" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/workforce/planning"><div className="text-sm font-medium">Planning</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/deployment"><div className="text-sm font-medium">Deployment</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/staff"><div className="text-sm font-medium">Paid staff</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/volunteers"><div className="text-sm font-medium">Volunteers</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/contractors"><div className="text-sm font-medium">Contractors</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/uniforms"><div className="text-sm font-medium">Uniforms</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/services"><div className="text-sm font-medium">Services</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/training"><div className="text-sm font-medium">Training</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/rosters"><div className="text-sm font-medium">Rosters</div></Link>
          <Link className="surface hover-lift p-4" href="/console/workforce/housing"><div className="text-sm font-medium">Housing</div></Link>
        </div>
      </div>
    </>
  );
}
