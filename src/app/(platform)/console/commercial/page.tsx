import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Commercial" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/commercial/sponsors"><div className="text-sm font-medium">Sponsors</div></a>
          <a className="surface hover-lift p-4" href="/console/commercial/hospitality"><div className="text-sm font-medium">Hospitality</div></a>
          <a className="surface hover-lift p-4" href="/console/commercial/tickets"><div className="text-sm font-medium">Ticketing</div></a>
          <a className="surface hover-lift p-4" href="/console/commercial/licensing"><div className="text-sm font-medium">Licensing</div></a>
          <a className="surface hover-lift p-4" href="/console/commercial/brand"><div className="text-sm font-medium">Brand</div></a>
        </div>
      </div>
    </>
  );
}
