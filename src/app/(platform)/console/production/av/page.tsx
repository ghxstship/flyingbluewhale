import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="AV systems" />
      <div className="page-content">
        <RoadmapStub
          title="AV systems"
          description="Scoreboards, sound, lighting control."
          inTheMeantime={{ href: "/console/production/equipment", label: "Open Equipment" }}
        />
      </div>
    </>
  );
}
