import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="Accommodation" />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <a className="surface hover-lift p-4" href="/console/accommodation/blocks"><div className="text-sm font-medium">Group blocks</div></a>
          <a className="surface hover-lift p-4" href="/console/accommodation/village"><div className="text-sm font-medium">Village</div></a>
        </div>
      </div>
    </>
  );
}
