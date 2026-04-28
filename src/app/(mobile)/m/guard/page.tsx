import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Guard" />
      <div className="page-content">
        <RoadmapStub
          title="Guard"
          description="Patrol log with geofenced checkpoints."
          inTheMeantime={{ href: "/console/safety/safeguarding", label: "Open Safeguarding" }}
        />
      </div>
    </>
  );
}
