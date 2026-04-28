import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Warehouse" />
      <div className="page-content">
        <RoadmapStub
          title="Warehouse"
          description="FF&E warehouse management. Mobile scanning via /m/wms."
          inTheMeantime={{ href: "/m/wms", label: "Open mobile warehouse scanning" }}
        />
      </div>
    </>
  );
}
