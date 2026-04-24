import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Comms" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/comms/internal"><div className="text-sm font-medium">Internal</div></a>
          <a className="surface hover-lift p-4" href="/console/comms/external"><div className="text-sm font-medium">External PR</div></a>
        </div>
      </div>
    </>
  );
}
