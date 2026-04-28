import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="New Encounter" />
      <div className="page-content">
        <RoadmapStub
          title="New Encounter"
          description="Log a new medical encounter."
          inTheMeantime={{ href: "/console/safety/medical/encounters/new", label: "Use the desktop form" }}
        />
      </div>
    </>
  );
}
