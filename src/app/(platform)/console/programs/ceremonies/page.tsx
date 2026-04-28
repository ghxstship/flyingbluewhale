import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Ceremonies" />
      <div className="page-content">
        <RoadmapStub
          title="Ceremonies"
          description="Opening, closing, victory, and mixed-zone ceremonies share one Run-of-Show module atop events + stage plots. Author cues in the Production module; run live on COMPVSS /m/ros."
          inTheMeantime={{ href: "/console/production/ros", label: "Open Run of Show" }}
        />
      </div>
    </>
  );
}
