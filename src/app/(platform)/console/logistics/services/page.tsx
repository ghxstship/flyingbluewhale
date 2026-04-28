import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Logistics Services" />
      <div className="page-content">
        <RoadmapStub
          title="Logistics Services"
          description="Waste and cleaning — service requests."
          inTheMeantime={{ href: "/console/services/requests", label: "Open service requests" }}
        />
      </div>
    </>
  );
}
