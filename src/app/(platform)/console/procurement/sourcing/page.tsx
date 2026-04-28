import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Sourcing" />
      <div className="page-content">
        <RoadmapStub
          title="Sourcing"
          description="RFQ and contract-linked sourcing events. Coordinates with existing /console/procurement/rfqs and Ironclad/DocuSign for final contracts."
          inTheMeantime={{ href: "/console/procurement/requisitions", label: "Open Requisitions" }}
        />
      </div>
    </>
  );
}
