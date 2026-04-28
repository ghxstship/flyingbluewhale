import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce Shuttles" />
      <div className="page-content">
        <RoadmapStub
          title="Workforce Shuttles"
          description="Shift-linked routes derived from rosters."
          inTheMeantime={{ href: "/console/workforce/rosters", label: "Open Rosters" }}
        />
      </div>
    </>
  );
}
