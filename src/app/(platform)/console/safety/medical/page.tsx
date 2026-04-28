import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Medical" />
      <div className="page-content">
        <RoadmapStub
          title="Medical"
          description="Medical plan + encounters + environmental response."
          inTheMeantime={{ href: "/console/safety/medical/encounters", label: "Open Medical Encounters" }}
        />
      </div>
    </>
  );
}
