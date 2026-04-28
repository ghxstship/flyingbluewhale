import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Master Schedule" />
      <div className="page-content">
        <RoadmapStub
          title="Master Schedule"
          description="Integrated master schedule across functional areas. Dependencies, critical path, and baselines map onto the existing /console/schedule feed."
          inTheMeantime={{ href: "/console/schedule", label: "Open the schedule feed" }}
        />
      </div>
    </>
  );
}
