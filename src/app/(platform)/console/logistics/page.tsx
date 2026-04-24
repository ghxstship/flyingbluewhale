import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Logistics" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link className="surface hover-lift p-4" href="/console/logistics/ratecard"><div className="text-sm font-medium">Rate card</div></Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/freight"><div className="text-sm font-medium">Freight</div></Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/warehouse"><div className="text-sm font-medium">Warehouse</div></Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/services"><div className="text-sm font-medium">Services</div></Link>
          <Link className="surface hover-lift p-4" href="/console/logistics/disposition"><div className="text-sm font-medium">Disposition</div></Link>
        </div>
      </div>
    </>
  );
}
