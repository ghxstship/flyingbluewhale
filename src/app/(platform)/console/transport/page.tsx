import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Transport" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/transport/dispatch"><div className="text-sm font-medium">Dispatch</div></a>
          <a className="surface hover-lift p-4" href="/console/transport/ad"><div className="text-sm font-medium">A&D</div></a>
          <a className="surface hover-lift p-4" href="/console/transport/workforce"><div className="text-sm font-medium">Workforce shuttles</div></a>
          <a className="surface hover-lift p-4" href="/console/transport/fleets"><div className="text-sm font-medium">Fleets</div></a>
        </div>
      </div>
    </>
  );
}
