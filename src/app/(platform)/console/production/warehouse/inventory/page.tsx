import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Inventory" />
      <div className="page-content">
        <RoadmapStub
          title="Inventory"
          description="Warehouse inventory."
          inTheMeantime={{ href: "/console/production/equipment", label: "Open Equipment" }}
        />
      </div>
    </>
  );
}
