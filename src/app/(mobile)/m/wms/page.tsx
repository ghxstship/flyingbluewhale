import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Warehouse" />
      <div className="page-content">
        <RoadmapStub
          title="Warehouse"
          description="Pick / put-away scanning."
          inTheMeantime={{ href: "/m/inventory/scan", label: "Open inventory scan" }}
        />
      </div>
    </>
  );
}
