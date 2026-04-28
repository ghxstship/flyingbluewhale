import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Arrivals & departures" />
      <div className="page-content">
        <RoadmapStub
          title="Arrivals & departures"
          description="Airport ground operations."
          inTheMeantime={{ href: "/console/transport/ad", label: "Open A&D manifests" }}
        />
      </div>
    </>
  );
}
