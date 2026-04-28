import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Warehouse Locations" />
      <div className="page-content">
        <RoadmapStub
          title="Warehouse Locations"
          description="Bin, zone, and location register."
          inTheMeantime={{ href: "/console/locations", label: "Open Locations" }}
        />
      </div>
    </>
  );
}
