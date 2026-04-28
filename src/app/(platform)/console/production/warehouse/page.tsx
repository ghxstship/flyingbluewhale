import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Warehouse" />
      <div className="page-content">
        <RoadmapStub
          title="Warehouse"
          description="Central + venue warehousing."
          inTheMeantime={{ href: "/console/production/equipment", label: "Open Equipment" }}
        />
      </div>
    </>
  );
}
