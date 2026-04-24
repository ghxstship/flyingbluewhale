import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Accreditation" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/accreditation/policy"><div className="text-sm font-medium">Policy</div></Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/categories"><div className="text-sm font-medium">Categories</div></Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/zones"><div className="text-sm font-medium">Zones</div></Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/vetting"><div className="text-sm font-medium">Vetting</div></Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/print"><div className="text-sm font-medium">Print queue</div></Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/scans"><div className="text-sm font-medium">Scans</div></Link>
          <Link className="surface hover-lift p-4" href="/console/accreditation/changes"><div className="text-sm font-medium">Changes</div></Link>
        </div>
      </div>
    </>
  );
}
