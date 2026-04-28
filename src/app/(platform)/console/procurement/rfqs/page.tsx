import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="RFQs" />
      <div className="page-content">
        <RoadmapStub
          title="RFQs"
          description="Request-for-quote pipeline."
          inTheMeantime={{ href: "/console/procurement/requisitions", label: "Open Requisitions" }}
        />
      </div>
    </>
  );
}
