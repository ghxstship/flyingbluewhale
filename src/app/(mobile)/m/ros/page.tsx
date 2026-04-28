import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Run of Show" />
      <div className="page-content">
        <RoadmapStub
          title="Run of Show"
          description="Live cue sheet."
          inTheMeantime={{ href: "/console/production/ros", label: "Open Run of Show" }}
        />
      </div>
    </>
  );
}
