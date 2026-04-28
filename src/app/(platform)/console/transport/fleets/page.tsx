import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Fleets" />
      <div className="page-content">
        <RoadmapStub
          title="Fleets"
          description="Vehicle and driver registry."
          inTheMeantime={{ href: "/console/transport/dispatch", label: "Open Dispatch" }}
        />
      </div>
    </>
  );
}
