import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Medical Plan" />
      <div className="page-content">
        <RoadmapStub
          title="Medical Plan"
          description="Games medical services plan. Integrates athlete, workforce, spectator medical services."
          inTheMeantime={{ href: "/console/safety/medical/encounters", label: "Open Medical Encounters" }}
        />
      </div>
    </>
  );
}
